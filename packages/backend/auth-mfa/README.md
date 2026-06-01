# @repo/backend-auth-mfa

> `otplib`으로 TOTP 시크릿·URI 생성·검증, `bcryptjs`로 백업 코드 해싱·검증을 제공하는 framework-agnostic MFA 패키지.

## 설치 / import
```ts
import { generateSecret, generateTotpUri, verifyTotp, generateBackupCodes, hashBackupCodes, verifyBackupCode } from "@repo/backend-auth-mfa";
```

## 핵심 API
- `generateSecret()` — TOTP 시크릿 문자열 생성
- `generateTotpUri({ secret, account, issuer })` — QR코드용 `otpauth://` URI 생성
- `verifyTotp({ secret, token })` — TOTP 6자리 코드 검증
- `generateBackupCodes(count)` / `hashBackupCodes(codes)` — 일회용 백업 코드 생성 및 bcrypt 해싱

## 자세히
- 레퍼런스: [`docs/reference/packages/backend-auth-mfa.md`](../../../docs/reference/packages/backend-auth-mfa.md)
- 동작 원리: [`docs/explainers/auth/mfa-totp-challenge.md`](../../../docs/explainers/auth/mfa-totp-challenge.md)
