# PR: spec-07-01 — OAuth Authorization Code + PKCE 인증 (Google / Kakao)

## Summary

- `@repo/backend-auth-oauth` 신규 패키지: PKCE, State CSRF 보호, Provider 설정, 토큰 교환, 계정 연결 로직
- `apps/api`: `GET /auth/oauth/:provider` (redirect) + `GET /auth/oauth/:provider/callback` (세션 발급) 엔드포인트 추가
- DB: `oauth_accounts` 테이블 추가, `users.password_hash` nullable로 변경 (소셜 전용 가입 지원)
- OAuth access/refresh token 미저장 정책 (ADR 후보: `oauth-token-no-storage`)

## 변경 파일

### 신규 패키지 `packages/backend/auth-oauth/`

| 파일 | 역할 |
|---|---|
| `src/pkce.ts` | `generateCodeVerifier()` (base64url 32바이트), `generateCodeChallenge()` (SHA-256) |
| `src/state.ts` | `generateState()`, `verifyState()` (timingSafeEqual 비교) |
| `src/providers.ts` | Google / Kakao OAuthProvider 설정 객체, `getProvider()` |
| `src/token.ts` | `exchangeCode()` (undici POST), `fetchUserInfo()` (undici GET) |
| `src/account.ts` | `findOrCreateOAuthUser()` — 신규 가입 / 이메일 연결 / 기존 계정 재사용 |
| `src/schema.ts` | `oauth_accounts` Drizzle 테이블 (패키지 레벨) |
| `src/index.ts` | 공개 API exports |

### `apps/api`

| 파일 | 변경 내용 |
|---|---|
| `src/infra/schema/users.ts` | `passwordHash` nullable |
| `src/infra/schema/oauth-accounts.ts` | [NEW] `oauth_accounts` 스키마 |
| `src/infra/schema/index.ts` | `oauthAccounts` appSchema 등록 |
| `drizzle/0005_bored_gravity.sql` | `oauth_accounts` CREATE + `password_hash` DROP NOT NULL |
| `src/auth/oauth.service.ts` | [NEW] `buildAuthorizationUrl()`, `handleCallback()` |
| `src/auth/oauth.controller.ts` | [NEW] `GET /auth/oauth/:provider`, `GET /auth/oauth/:provider/callback` |
| `src/auth/oauth.stores.ts` | [NEW] Drizzle `OAuthAccountStore` 구현 |
| `src/auth/auth.module.ts` | OAuthService, OAuthController, OAUTH_ACCOUNT_STORE 등록 |
| `src/settings.ts` | OAuth 환경변수 추가 (GOOGLE_*, KAKAO_*, OAUTH_REDIRECT_BASE_URL) |
| `src/auth/auth.e2e.test.ts` | OAuth e2e 테스트 3케이스 추가 |
| `package.json` | `@repo/backend-auth-oauth` 의존성 추가 |

## Test Plan

- [x] `@repo/backend-auth-oauth` 단위 테스트 19개 PASS (pkce, state, token, account)
- [x] `apps/api` 전체 56 tests PASS (기존 53 + OAuth 3 신규)
- [x] `GET /auth/oauth/google` → 302 + `code_challenge` + `state` 쿼리 파라미터 포함
- [x] `GET /auth/oauth/kakao` → 302 + `kauth.kakao.com` Location
- [x] state 불일치 callback → 401
- [x] 타입체크 28 packages 0 errors
- [x] Biome lint errors 없음

## 보안 설계

- **PKCE S256**: `code_verifier` (32바이트 랜덤) → SHA-256 → base64url `code_challenge`
- **State CSRF**: 32바이트 랜덤 state를 httpOnly SameSite=Lax 쿠키에 저장, `timingSafeEqual`로 비교
- **Token 미저장**: OAuth access/refresh token을 DB에 저장하지 않음 (providerAccountId만 저장) — 암호화 키 관리 복잡성 제거
- **PKCE 쿠키 스코프**: `path=/auth/oauth/:provider/callback`으로 범위 제한

🤖 Generated with [Claude Code](https://claude.com/claude-code)
