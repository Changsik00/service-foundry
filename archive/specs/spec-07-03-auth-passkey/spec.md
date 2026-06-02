# spec-07-03: auth-passkey

## 목표

WebAuthn Passkey 등록 및 인증 백엔드를 구현한다.  
브라우저 클라이언트 없이 백엔드 API 4개 엔드포인트를 제공한다.

## 범위

- `@repo/backend-auth-passkey` 패키지 신설 (simplewebauthn 래퍼)
- DB 테이블: `passkey_credentials`, `passkey_challenges`
- `PasskeyService`, `PasskeyStore`, `PasskeyController`
- `AuthModule`에 등록
- 단위 테스트 + E2E 테스트

## 엔드포인트

| Method | Path | Guard | 설명 |
|--------|------|-------|------|
| POST | /auth/passkey/register/options | AuthGuard | WebAuthn 등록 options 발급 |
| POST | /auth/passkey/register/verify | AuthGuard | 등록 credential 검증 |
| POST | /auth/passkey/authenticate/options | 없음 | WebAuthn 인증 options 발급 |
| POST | /auth/passkey/authenticate/verify | 없음 | 인증 credential 검증 + 세션 발급 |

## 제외 범위

- 브라우저 클라이언트 (이후 spec-07-04 이후)
- 실제 브라우저 E2E (navigator.credentials API 필요)
