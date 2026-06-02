# PR: spec-06-03 — cookie-strategy

## 요약

`apps/api` 에 Cookie 기반 인증 5 endpoints 신설. ADR-0014 Decision 6 — httpOnly + Secure + SameSite=Lax `refresh_token` cookie 발급/검증/갱신 구현.

## 변경 내용

### `@repo/backend-auth-jwt` 확장

- `SignAccessTokenPayload` 에 index signature 추가 → `role` 등 custom claim 포함 가능 (하위 호환)

### `apps/api`

| 파일 | 내용 |
|---|---|
| `src/infra/schema/users.ts` | `role text DEFAULT 'user' NOT NULL` 컬럼 추가 |
| `drizzle/0002_boring_silver_sable.sql` | sessions 테이블 migration |
| `drizzle/0003_legal_blue_shield.sql` | users.role 컬럼 migration |
| `src/auth/cookie.helper.ts` | `setRefreshTokenCookie` / `clearRefreshTokenCookie` |
| `src/auth/jwt-sign.options.ts` | `JWT_SIGN_OPTIONS` 토큰 + `JwtSignOptions` interface |
| `src/auth/session.stores.ts` | `SESSION_STORE` 토큰 + `createDrizzleSessionStore` |
| `src/auth/signin.service.ts` | signIn + refresh + revokeSession |
| `src/auth/signup.service.ts` | signUp |
| `src/auth/auth.controller.ts` | 5 endpoints 추가 (signin/signup/signout/refresh/me) |
| `src/auth/auth.module.ts` | JwtModule import + AuthGuard + JWT/Session stores 배선 |
| `src/auth/password-reset.stores.ts` | `UserStore` 에 `insert` + `findById` 추가 |

### 5 Endpoints

| Method | Path | 응답 |
|---|---|---|
| `POST` | `/auth/signin` | `{ accessToken, user }` + refresh_token cookie |
| `POST` | `/auth/signup` | `{ accessToken, user }` + refresh_token cookie |
| `POST` | `/auth/signout` | `{ status: "ok" }` + cookie 삭제 |
| `POST` | `/auth/refresh` | `{ accessToken, user }` + 새 cookie |
| `GET` | `/auth/me` | `{ user: AuthenticatedUser }` (AuthGuard 보호) |

## 테스트

```
Tests       40 passed (단위) + 4 skipped (e2e DB 미연결)
Test Files  9 passed
```

- `signin.service.test.ts`: 성공 / email 없음 / password 틀림 (3케이스)
- `signup.service.test.ts`: 성공 / 이메일 중복 / hashPassword+insert 검증 (3케이스)
- `auth.controller.test.ts`: 5 endpoints × mock service (8케이스)

## 주요 결정

1. **`NESTJS_AUTH_OPTIONS` 로컬 재제공**: `AuthModule` 에서 `JwtService + JWT_SIGN_OPTIONS` 조합으로 로컬 등록 → NestjsAuthModule cross-module DI 불필요.
2. **`users.role` 컬럼**: `auth-contracts JwtPayload.role` 요구사항 gap 해결. DEFAULT `'user'`.
3. **signout fire-and-forget**: cookie 삭제 항상 성공 보장, session revoke 는 best-effort.

## 체크리스트

- [x] 단위 테스트 PASS (40 tests)
- [x] `pnpm typecheck` PASS (26 packages)
- [x] `biome check src/` — errors 0
- [x] walkthrough.md 작성
- [x] pr_description.md 작성
