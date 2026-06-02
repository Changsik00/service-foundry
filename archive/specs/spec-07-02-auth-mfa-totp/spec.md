# spec-07-02: MFA TOTP 등록 · 검증 · Signin 연동

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-07-02` |
| **Phase** | `phase-07` |
| **Branch** | `spec-07-02-auth-mfa-totp` |
| **상태** | Planning |
| **타입** | Feature |
| **Integration Test Required** | yes |
| **작성일** | 2026-05-22 |
| **소유자** | dennis |

## 📋 배경 및 문제 정의

### 현재 상황

- phase-05 AuthResult union에 `mfa_required` 분기가 이미 정의되어 있으나 실제로 트리거되지 않음.
- spec-07-01에서 OAuth 소셜 로그인 완료. 이제 *본인 확인 강화* 단계.
- TOTP(Time-based One-Time Password)는 SMS 없이 앱(Google Authenticator 등)으로 2FA를 구현하는 표준 방식(RFC 6238).

### 문제점

- 현재 패스워드 단독 인증은 자격증명 유출 시 계정 탈취 가능.
- `mfa_required` AuthResult가 존재하나 실제 진입 경로 없음.

### 해결 방안 (요약)

`@repo/backend-auth-mfa` 패키지에 TOTP 핵심 로직 구현 후, apps/api에 enroll/confirm/verify/disable 엔드포인트를 추가한다. signin 흐름에 MFA 분기를 연결해 `mfa_required` 응답 → 단기 challenge token → TOTP verify → 세션 발급 순서로 동작한다.

## 🎯 요구사항

### Functional Requirements

1. **TOTP Enroll** (`POST /auth/mfa/totp/enroll`): 인증된 사용자가 TOTP 시크릿을 생성하고 QR code URL과 backup codes를 반환받는다. MFA는 아직 활성화되지 않는다.
2. **TOTP Enroll Confirm** (`POST /auth/mfa/totp/enroll/confirm`): 첫 TOTP 코드를 입력해 검증 성공 시 MFA를 활성화한다. Replay 방지를 위해 직전 사용 코드를 차단한다(window drift ±1).
3. **MFA-aware Signin**: MFA가 활성화된 계정으로 signin 시 session 발급 대신 `{ status: "mfa_required", mfaChallengeToken }` 응답. challenge token은 5분 만료 단기 JWT.
4. **TOTP Verify** (`POST /auth/mfa/totp/verify`): `{ mfaChallengeToken, code }` 수신 → challenge token 검증 → TOTP code 검증 → 세션(refresh cookie) + access token 발급.
5. **Backup Code 사용**: `code` 필드에 backup code 입력 시 일회성 사용 후 소진. 소진 후 재사용 불가.
6. **TOTP Disable** (`POST /auth/mfa/totp/disable`): 현재 유효한 TOTP 코드 입력 후 MFA 비활성화. `mfa_configs` 레코드 삭제.

### Non-Functional Requirements

1. TOTP 시크릿은 평문 저장 (현 단계). 암호화는 별도 ADR로 결정.
2. Backup codes는 bcrypt hash 저장 (일회용 패스워드와 동일 취급).
3. challenge token은 기존 JWT 인프라(`@repo/backend-auth-jwt`)를 재사용. payload: `{ sub, type: "mfa_challenge" }`, exp: 5분.
4. TOTP 라이브러리: `otplib` (RFC 6238 호환, HMAC-SHA1).

## 🚫 Out of Scope

- SMS/Email OTP (별도 spec)
- TOTP 시크릿 DB 암호화 (ADR 후보로만 기록)
- MFA 복구 흐름 (admin reset 등)
- React hook (`useMfaChallenge`) — spec-07-04에서 처리

## 📑 ADR 후보

- [ ] ADR 가치 있는 결정 있음 → `mfa-secret-plaintext-storage` (type: tradeoff) — 시크릿 평문 저장의 위험과 암호화 미구현 사유

## ✅ Definition of Done

- [ ] `@repo/backend-auth-mfa` 단위 테스트 PASS (TOTP 생성/검증/backup)
- [ ] apps/api e2e: enroll → confirm → signin(mfa_required) → verify 전체 플로우 PASS
- [ ] walkthrough.md + pr_description.md 작성
- [ ] `spec-07-02-auth-mfa-totp` 브랜치 push + PR (base: phase-07-auth-extension)
