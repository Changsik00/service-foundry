# spec-x: AuthStore + http-client 인증 통합 (역주입 패턴) + full-stack e2e

## 변경 내용

인증 상태(SDK)를 http-client에 역주입(Reverse Injection)하여,
http-client가 토큰 획득·갱신·blocking을 직접 위임받아 처리하도록 설계.

추가로: 루트 `.env` 통합, Supabase JWKS 검증, full-stack Playwright e2e 완성.

---

## 신규 패키지: `@repo/frontend-auth-store`

### AuthStatus 3-state

| 상태 | 의미 |
|---|---|
| `"unknown"` | SDK 초기화 중 |
| `"authenticated"` | 토큰 있음, 로그인 완료 |
| `"unauthenticated"` | 명확히 로그인 안 된 상태 |

### SDK 어댑터

```typescript
connectFirebaseAuth(store, firebaseAuth)
connectSupabaseAuth(store, supabaseClient)
connectNativeJwt(store, opts)
```

---

## http-client 동작 매트릭스

| status | requiresAuth | 동작 |
|---|---|---|
| `unknown` | any | `waitUntilSettled()` (5초) 후 분기 |
| `authenticated` | any | Bearer 토큰 붙여서 진행 |
| `unauthenticated` | `false` | 토큰 없이 진행 (public) |
| `unauthenticated` | `true` | `AppError(401)` 즉시 throw |

401 수신 시: token이 있었으면 `refresh()` → 재시도 1회.

---

## Supabase JWKS 기반 JWT 검증 (ECC P-256)

신형 Supabase 프로젝트는 HS256 대신 비대칭 ECC P-256 사용.
`SUPABASE_JWT_SECRET` 없이 JWKS 엔드포인트로 공개키 자동 조회:

```
GET ${SUPABASE_URL}/auth/v1/.well-known/jwks.json
```

`SupabaseVerifier`가 `createRemoteJWKSet` (jose)로 키를 캐싱 후 검증.
legacy 프로젝트(HS256)는 `jwtSecret` 옵션으로 폴백.

---

## 루트 `.env` 통합

기존: 앱마다 `.env` 별도 관리 → drift 발생.

```
.env          # 전체 앱 공통 (gitignored)
.env.sample   # 키 템플릿 (새로 추가)
```

### Supabase 키 이름 표준화 (대시보드 최신 명칭)

```
SUPABASE_URL             # 공통 (모든 앱)
SUPABASE_PUBLISHABLE_KEY # 구 ANON_KEY (프런트 전용)
SUPABASE_SECRET_KEY      # 구 SERVICE_ROLE_KEY (테스트 fixtures 전용)
```

---

## full-stack Playwright e2e

`apps/api` + `apps/web-next` 동시 기동 후 실제 HTTP 흐름 검증:

```
브라우저 로그인 (Supabase) → JWT 추출 → GET /api/auth/me (Bearer) → NestJS JWKS 검증 → 200
```

### e2e 테스트 결과 (7/7 PASS)

| 테스트 | 결과 |
|---|---|
| 로그인 성공 → 홈 리다이렉트 | ✅ |
| 잘못된 비밀번호 → 오류 메시지 | ✅ |
| 로그인 후 Bearer 헤더 자동 주입 | ✅ |
| 로그인 후 GET /auth/me → 200 | ✅ |
| 미인증 GET /auth/me → 401 | ✅ |
| 미인증 public API → 즉시 진행 | ✅ |
| 401 → refresh → 재시도 2회 | ✅ |

---

## 변경 파일

| 파일 | 변경 |
|---|---|
| `packages/shared/auth-contracts/src/index.ts` | `AuthStatus` + `AuthSource` 추가 |
| `packages/frontend/auth-store/` (신규) | Zustand vanilla store + 3개 SDK 어댑터 |
| `packages/frontend/http-client/src/index.ts` | `auth?: AuthSource` + blocking + 401 재시도 |
| `packages/nestjs/auth-supabase/src/supabase-verifier.ts` | JWKS 지원 + role 매핑 |
| `packages/nestjs/auth-supabase/src/supabase-auth.module.ts` | `supabaseUrl` 옵션 추가 |
| `apps/api/src/auth/provider-auth.module.ts` | verifierModule re-export 수정 |
| `apps/api/src/auth/provider-me.controller.ts` (신규) | `GET /auth/me` 보호 엔드포인트 |
| `apps/api/src/settings.ts` | `SUPABASE_URL` 추가 + boot guard |
| `apps/api/src/app.module.ts` | supabase 모드 JWKS URL 전달 |
| `apps/web-next/src/env.ts` | 서버/클라이언트 스키마 분리 |
| `apps/web-next/src/lib/supabase-auth.ts` | `getPublicEnv()` 사용 |
| `apps/web-next/playwright.config.ts` | 두 webServer + `NEXT_PUBLIC_*` 전달 |
| `apps/web-next/e2e/fixtures.ts` | `SUPABASE_URL` + `SUPABASE_SECRET_KEY` |
| `apps/web-next/e2e/http-auth.spec.ts` | GET /auth/me 검증 추가 |
| `.env.sample` (신규) | 루트 env 템플릿 |
| `.github/workflows/e2e.yml` | 새 키 이름 + apps/api webServer |

---

## 검증

- `@repo/frontend-auth-store` → 26/26 PASS
- `@repo/frontend-http-client` → 23/23 PASS
- `@repo/frontend-auth-react` → 20/20 PASS
- `pnpm turbo run typecheck` → PASS
- **Playwright e2e → 7/7 PASS**

## 커밋 목록

- `feat(spec-x-auth-http-integration)`: AuthStatus + AuthSource 계약 추가
- `feat(spec-x-auth-http-integration)`: auth-store 패키지 신규 생성 (Zustand + 어댑터)
- `feat(spec-x-auth-http-integration)`: http-client auth 주입 (blocking + 토큰 자동 주입)
- `chore(spec-x-auth-http-integration)`: auth-store vitest.config.ts 추가 (knip 오탐 수정)
- `feat(spec-x-auth-http-integration)`: web-next Supabase auth 연결 (wiring)
- `feat(spec-x-auth-http-integration)`: Playwright e2e (auth + 토큰 주입 검증)
- `fix(spec-x-auth-http-integration)`: auth-store 내부 import .js 확장자 제거
- `feat(spec-x-auth-http-integration)`: 루트 .env 통합 + Supabase JWKS 검증 + full-stack e2e
- `fix(spec-x-auth-http-integration)`: env.ts 서버/클라이언트 분리 + e2e 환경변수 수정
