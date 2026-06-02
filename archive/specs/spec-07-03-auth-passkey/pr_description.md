# PR: spec-07-03 auth-passkey

## 변경 요약

WebAuthn Passkey 등록 및 인증 백엔드를 구현합니다.

### 신규 패키지
- `@repo/backend-auth-passkey` — `@simplewebauthn/server` v13.3 래퍼. `generateRegistrationOpts`, `verifyRegistration`, `generateAuthenticationOpts`, `verifyAuthentication` + 타입 재export

### DB 변경 (migration: 0007)
- `passkey_credentials` — userId, credentialId(unique), publicKey(base64url text), counter, deviceType, backedUp, transports
- `passkey_challenges` — UUID PK(=challengeToken), challenge, userId(nullable), expiresAt (TTL 5분)

### API 신규 (apps/api)
| Method | Path | Guard | 응답 |
|--------|------|-------|------|
| POST | /auth/passkey/register/options | AuthGuard | `{challengeToken, options}` |
| POST | /auth/passkey/register/verify | AuthGuard | `{status:"ok"}` |
| POST | /auth/passkey/authenticate/options | 없음 | `{challengeToken, options}` |
| POST | /auth/passkey/authenticate/verify | 없음 | `{accessToken}` + refresh cookie |

### 테스트
- `passkey.service.test.ts` 8개 단위 테스트 (vi.mock)
- `auth.e2e.test.ts` 6개 E2E 테스트 추가

## 테스트 계획

- [x] `pnpm --filter api test` — 단위 + E2E 테스트 통과
- [x] `pnpm -r typecheck` — 36개 패키지 타입 오류 없음
- [x] DB 마이그레이션 적용 확인
