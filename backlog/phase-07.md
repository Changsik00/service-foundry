# phase-07: Auth Extension — OAuth + MFA + Passkey

> 2차안 §Phase 4. `auth-oauth` (PKCE+state) + `auth-mfa` (TOTP) + `auth-passkey` (WebAuthn).

## 📋 메타

| 항목 | 값 |
|---|---|
| **Phase ID** | `phase-07` |
| **상태** | Backlog |
| **시작일** | 미정 |
| **목표 종료일** | 미정 |
| **소유자** | dennis |
| **Base Branch** | phase-07-auth-extension |

## 🎯 배경 및 목표

### 현재 상황

- phase-05/06 완료 시 *기본 auth*(signin/signup/refresh/cookie/RBAC) 동작.
- 본 phase는 *확장 feature*: Social login (OAuth) + Multi-factor auth (TOTP) + Passwordless (WebAuthn Passkey).
- 2차안: "MFA / Passkey 처음부터 인터페이스에 자리 만들어두기" — phase-05의 AuthResult union(`mfa_required`)이 이미 박혀있음. 본 phase는 *구현*.

### 목표 (Goal)

`@repo/auth-oauth` + `@repo/auth-mfa` + `@repo/auth-passkey` + 각 패키지의 frontend/backend 통합. apps/api에 OAuth callback / MFA enroll/verify / WebAuthn register/authenticate endpoint.

### 성공 기준 (Success Criteria) — 정량 우선

1. `@repo/auth-oauth` — Google + Kakao OAuth (Authorization Code + PKCE + State + Nonce).
2. `@repo/auth-mfa` — TOTP enroll + verify (Google Authenticator / Authy 호환).
3. `@repo/auth-passkey` — `@simplewebauthn/server` + `@simplewebauthn/browser` 통합.
4. AuthResult union의 `mfa_required` 분기 실제 동작.
5. E2E: OAuth Google login → MFA TOTP 등록 → MFA 검증 → Passkey 등록 → Passkey 로그인.

## 🧩 작업 단위 (SPECs)

<!-- sdd:specs:start -->
| ID | 슬러그 | 우선순위 | 상태 | 디렉토리 |
|---|---|:---:|---|---|
| `spec-07-01` | auth-oauth | P? | Merged | `specs/spec-07-01-auth-oauth/` |
| `spec-07-02` | auth-mfa-totp | P? | Merged | `specs/spec-07-02-auth-mfa-totp/` |
| `spec-07-03` | auth-passkey | P? | Merged | `specs/spec-07-03-auth-passkey/` |
<!-- sdd:specs:end -->

### spec-07-01 — auth-oauth (Core + Providers 번들)

- **요점**: OAuth Authorization Code flow + PKCE + State (cookie-bound) + Nonce (OIDC) + Google + Kakao provider 설정 + `/auth/oauth/:provider` + `/auth/oauth/:provider/callback` endpoint.
- **참조**: ADR-0014 §OAuth.
- **연관 모듈**: `packages/backend/auth-oauth` + apps/api
- **번들 사유**: core와 providers는 분리 시 실익이 없어 단일 PR로 합산.

### spec-07-02 — auth-mfa-totp

- **요점**: TOTP enroll (QR code 발급) + verify + backup codes.
- **라이브러리**: `otplib` 또는 동등.
- **연관 모듈**: `packages/backend/auth-mfa`

### spec-07-03 — auth-passkey

- **요점**: WebAuthn register + authenticate. `@simplewebauthn/server` + frontend `@simplewebauthn/browser` 통합.
- **참조**: design note §MFA / Passkey.
- **연관 모듈**: `packages/backend/auth-passkey` + `packages/frontend/auth-react` (passkey hook)

### spec-07-04 — mfa-react-hook

- **요점**: `useMfaChallenge` hook — AuthResult `mfa_required` 분기 처리. TOTP code 입력 UI + Passkey 인증 UI.
- **연관 모듈**: `packages/frontend/auth-react`

## 📌 결정 기록 (Review)

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| MFA 방식 우선순위 | TOTP / SMS / Email OTP / Passkey | TOTP + Passkey | SMS는 SIM swap 위험으로 비추 (design note). Email OTP은 fallback |
| OAuth providers | Google + Kakao + GitHub | Google + Kakao | 한국 시장 + 글로벌. GitHub은 후속 |
| Passkey 라이브러리 | `@simplewebauthn` / 자체 구현 | `@simplewebauthn` | 검증된 라이브러리. 직접 구현 금지 (ADR-0006 §Auth Engine 외부 라이브러리) |

## 🧪 통합 테스트 시나리오 (간결)

### 시나리오 1: OAuth Google login

- **Given**: spec-07-01 + spec-07-02 머지됨.
- **When**: `/auth/oauth/google` → Google 인증 → callback.
- **Then**: cookie 발급 + Internal Session 생성 (Provider token은 BE에서만 보관).
- **연관 SPEC**: spec-07-01, spec-07-02

### 시나리오 2: MFA TOTP round-trip

- **Given**: spec-07-03 머지됨.
- **When**: TOTP enroll → QR code 스캔 → code 입력 → 검증 → signin 시 MFA 단계.
- **Then**: 정상 검증 시 session 발급. 잘못된 code 시 MFA_INVALID_CODE.
- **연관 SPEC**: spec-07-03, spec-07-05

### 시나리오 3: Passkey register + authenticate

- **Given**: spec-07-04 머지됨.
- **When**: Passkey 등록 → 새 세션에서 Passkey 로그인.
- **Then**: password 없이 인증 성공.
- **연관 SPEC**: spec-07-04, spec-07-05

## 🔗 의존성

- **선행 phase**: phase-05 (auth core) + phase-06 (auth integration).
- **외부 시스템**: Google OAuth credential / Kakao Developer credential.
- **연관 ADR**: 0006 / 0014
- **연관 design note**: `docs/notes/auth-foundation-architecture.md`

## 🏁 Phase Done 조건

- [ ] 모든 SPEC(spec-07-01 ~ spec-07-04) main에 merge
- [ ] 성공 기준 5개 충족
- [ ] 통합 테스트 3개 시나리오 PASS
- [ ] 사용자 최종 승인
