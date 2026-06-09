# Walkthrough: spec-18-03 — Supabase 백엔드 verifier

## 개요

`@repo/nestjs-auth-supabase` 신규 패키지를 생성했다. `jose` `jwtVerify`로 Supabase HS256 JWT를 검증하는 `SupabaseVerifier implements AccessTokenVerifier`를 구현하고, `NestjsSupabaseAuthModule.forRoot(opts)`로 NestJS 모듈을 제공한다.

spec-18-02(Firebase)와 동일 패턴 — `@supabase/supabase-js` 의존 없이 경량 구현.
apps/api 배선·DB 스키마 마이그레이션은 spec-18-04에서 처리한다.

## 커밋 요약

| # | 커밋 해시 | 내용 |
|---|---|---|
| 1 | 028d3cc | `test(spec-18-03)`: SupabaseVerifier 단위 테스트 + 패키지 스캐폴딩 (Red) |
| 2 | ad1bee7 | `feat(spec-18-03)`: SupabaseVerifier 구현 (Green) |
| 3 | dcbb842 | `feat(spec-18-03)`: NestjsSupabaseAuthModule + public API |

## 패키지 구조

```
packages/nestjs/auth-supabase/
├── package.json                      (@repo/nestjs-auth-supabase)
├── tsconfig.json
├── vitest.config.ts
└── src/
    ├── supabase-provision-port.ts    SUPABASE_PROVISION_PORT + SupabaseProvisionPort 인터페이스
    ├── supabase-verifier.ts          SupabaseVerifier + SUPABASE_JWT_OPTIONS 심볼
    ├── supabase-verifier.test.ts     단위 테스트 5개 (실제 HS256 JWT)
    ├── supabase-auth.module.ts       NestjsSupabaseAuthModule.forRoot()
    └── index.ts                      public API
```

## 핵심 구현

### SupabaseVerifier.verify(token)

1. `jwtVerify(token, new TextEncoder().encode(jwtSecret))` — 실패 시 `UnauthorizedException`
2. `payload.sub` → `sub`, `payload.role ?? "user"` → `role`
3. `payload[ACTIVE_ORG_CLAIM]` 우선, fallback `payload.app_metadata?.[ACTIVE_ORG_CLAIM]` → `orgId`
4. `orgId === null` + `provision` 주입된 경우: `provision.provisionFromProvider(sub, email)` → `orgId`
   - Supabase에는 `setCustomUserClaims` API 없음 → DB만 업데이트

### Firebase 대비 차이

| 항목 | FirebaseVerifier | SupabaseVerifier |
|---|---|---|
| 검증 방식 | `firebase-admin` `verifyIdToken` | `jose` `jwtVerify` (HS256) |
| claims 주입 | `setCustomUserClaims` 호출 | 없음 (DB만 업데이트) |
| 테스트 방식 | `vi.mock('firebase-admin/auth')` | 실제 `SignJWT`로 테스트 JWT 생성 |
| 신규 catalog | `firebase-admin` | 없음 (`jose` 기존 등록) |

### NestjsSupabaseAuthModule.forRoot(opts)

- `SUPABASE_JWT_OPTIONS → opts` provide
- `SupabaseVerifier` provider
- `ACCESS_TOKEN_VERIFIER → SupabaseVerifier` provide·export
- `SUPABASE_PROVISION_PORT` optional — 없으면 provisioning skip

## 검증 결과

| 게이트 | 결과 |
|---|---|
| `@repo/nestjs-auth-supabase test` | 5/5 PASS |
| biome lint | PASS |
| typecheck (turbo) | PASS |
| depcruise | 위반 없음 (430 modules) |

## 이후 단계

- **spec-18-04**: apps/api 배선 + `AUTH_MODE` env + 조건부 모듈 로딩 + DB 마이그레이션
