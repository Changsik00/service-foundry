# PR: spec-07-02 — MFA TOTP 등록 · 검증 · Signin 연동

## Summary

- `@repo/backend-auth-mfa` 신규 패키지: TOTP 생성/검증 (otplib), Backup code 생성/해시/검증 (bcryptjs)
- DB: `mfa_configs` 테이블 추가 (userId UNIQUE, secret, backupCodeHashes, enabled)
- `apps/api`: `/auth/mfa/totp/enroll`, `/enroll/confirm`, `/verify`, `/disable` 엔드포인트
- `POST /auth/signin` MFA 분기: enabled 계정 → `{ status: "mfa_required", mfaChallengeToken }` 응답
- MFA Challenge Token: JWT (audience=`mfa_challenge`, 5분 만료)

## 변경 파일

### 신규 패키지 `packages/backend/auth-mfa/`

| 파일 | 역할 |
|---|---|
| `src/totp.ts` | `generateSecret(20B)`, `generateTotpUri()`, `verifyTotp()` (otplib) |
| `src/backup.ts` | `generateBackupCodes()` (8자리 hex × 10), `hashBackupCodes()`, `verifyBackupCode()` (bcryptjs) |
| `src/index.ts` | 공개 API exports |

### `apps/api`

| 파일 | 변경 내용 |
|---|---|
| `src/infra/schema/mfa-configs.ts` | [NEW] mfa_configs 스키마 |
| `drizzle/0006_last_doctor_doom.sql` | mfa_configs CREATE TABLE |
| `src/auth/mfa.stores.ts` | [NEW] MfaStore interface + Drizzle 구현 |
| `src/auth/mfa.service.ts` | [NEW] enroll / confirmEnroll / verifyMfa / disable |
| `src/auth/mfa.controller.ts` | [NEW] POST /auth/mfa/totp/* |
| `src/auth/auth.controller.ts` | signIn MFA 분기 (`@Optional MfaService`) |
| `src/auth/auth.module.ts` | MfaService, MfaController, MFA_STORE 등록 |
| `src/auth/auth.e2e.test.ts` | MFA 수직 슬라이스 9 tests 추가 |

## Test Plan

- [x] `@repo/backend-auth-mfa` 단위 테스트 14개 PASS (totp 6, backup 8)
- [x] `apps/api` 전체 65 tests PASS (기존 56 + MFA 9 신규)
- [x] enroll → confirm → signin(mfa_required) → verify → disable → signin(정상) 전체 플로우 PASS
- [x] 잘못된 TOTP 코드 → 401
- [x] 타입체크 35 packages 0 errors

## 보안 설계

- **TOTP RFC 6238**: otplib authenticator (HMAC-SHA1, 30초 window)
- **Backup codes**: bcrypt 해시 저장, confirm 완료 후 최초 1회만 평문 노출
- **MFA Challenge Token**: short-lived JWT (audience=mfa_challenge, 5분) — 일반 access token과 audience 분리
- **TOTP 시크릿 평문 저장**: 암호화 키 관리 복잡성 제거 (ADR 후보: `mfa-secret-plaintext-storage`)
