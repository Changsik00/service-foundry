# spec-x: AuthStore + http-client 인증 통합 (역주입 패턴)

## 변경 내용

인증 상태(SDK)를 http-client에 역주입(Reverse Injection)하여,
http-client가 토큰 획득·갱신·blocking을 직접 위임받아 처리하도록 설계.

### 이전 접근 (PR #130, 닫음)

```typescript
// 토큰 주입 없이 refresh 트리거만 — 반쪽짜리
createHttpClient({
  onUnauthorized: () => sdk.refresh(),
})
```

### 이번 접근

```typescript
// auth-store로 SDK 이벤트 수집 → http-client에 주입
const authStore = createAuthStore();
connectFirebaseAuth(authStore, firebaseAuth); // onAuthStateChanged 연결

createHttpClient({
  baseUrl,
  auth: createAuthSource(authStore), // AuthSource 주입
})

// protected API
httpClient.get("/me", { requiresAuth: true })

// public API
httpClient.get("/products")
```

---

## 신규 패키지: `@repo/frontend-auth-store`

### AuthStatus 3-state

| 상태 | 의미 |
|---|---|
| `"unknown"` | SDK 초기화 중 (Firebase `onAuthStateChanged` 콜백 전) |
| `"authenticated"` | 토큰 있음, 로그인 완료 |
| `"unauthenticated"` | 명확히 로그인 안 된 상태 |

### SDK 어댑터

```typescript
connectFirebaseAuth(store, firebaseAuth)    // onAuthStateChanged 연결
connectSupabaseAuth(store, supabaseClient)  // onAuthStateChange 연결
connectNativeJwt(store, opts)              // startup refresh + localStorage
```

---

## http-client 동작 매트릭스

| status | requiresAuth | 동작 |
|---|---|---|
| `unknown` | any | `waitUntilSettled()` (5초) 후 분기 |
| `authenticated` | any | token 붙여서 진행 |
| `unauthenticated` | `false` | token 없이 진행 (public) |
| `unauthenticated` | `true` | `AppError(401)` 즉시 throw — fetch 없음 |

401 수신 시: token이 있었으면 `refresh()` → 재시도 1회. token 없었으면 즉시 throw.

---

## 변경 파일

| 파일 | 변경 |
|---|---|
| `packages/shared/auth-contracts/src/index.ts` | `AuthStatus` 타입 + `AuthSource` 인터페이스 추가 |
| `packages/frontend/auth-store/` (신규) | Zustand vanilla store + 3개 SDK 어댑터 |
| `packages/frontend/http-client/src/index.ts` | `auth?: AuthSource` + `requiresAuth` + blocking 로직 |
| `packages/frontend/http-client/package.json` | `@repo/auth-contracts` 의존성 추가 |
| `pnpm-workspace.yaml` | `zustand: ^5.0.0` catalog 추가 |
| `apps/web-next/src/lib/supabase-auth.ts` (신규) | SDK + auth-store 연결, AuthSource export |
| `apps/web-next/src/lib/http-client.ts` | `auth: source` 역주입 |
| `apps/web-next/src/env.ts` | Supabase 환경변수 검증 추가 |
| `apps/web-next/e2e/` (신규) | Playwright e2e — auth + 토큰 주입 검증 |
| `.github/workflows/e2e.yml` (신규) | CI e2e 워크플로우 (Supabase secrets 연동) |

---

## 검증

- `@repo/frontend-auth-store` → 26/26 PASS
- `@repo/frontend-http-client` → 23/23 PASS
- `@repo/frontend-auth-react` → 20/20 PASS
- `pnpm turbo run typecheck` → 54/54 PASS
- Playwright e2e → `.env`에 Supabase 값 설정 후 `pnpm test:e2e`로 로컬 실행

## 커밋 목록

- `feat(spec-x-auth-http-integration)`: AuthStatus + AuthSource 계약 추가
- `feat(spec-x-auth-http-integration)`: auth-store 패키지 신규 생성 (Zustand + 어댑터)
- `feat(spec-x-auth-http-integration)`: http-client auth 주입 (blocking + 토큰 자동 주입)
- `chore(spec-x-auth-http-integration)`: auth-store vitest.config.ts 추가 (knip 오탐 수정)
- `feat(spec-x-auth-http-integration)`: web-next Supabase auth 연결 (wiring)
- `feat(spec-x-auth-http-integration)`: Playwright e2e (auth + 토큰 주입 검증)
