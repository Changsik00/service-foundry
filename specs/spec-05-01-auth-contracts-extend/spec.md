# spec-05-01: auth-contracts-extend — 5 schema + AuthResult union + ts-pattern

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-05-01` |
| **Phase** | `phase-05` |
| **Branch** | `spec-05-01-auth-contracts-extend` |
| **상태** | Planning |
| **타입** | Feature |
| **Integration Test Required** | no (단위 + ts-pattern exhaustiveness test) |
| **작성일** | 2026-05-20 |
| **소유자** | dennis |

## 📋 배경 및 문제 정의

### 현재 상황

- `@repo/auth-contracts` 의 현 schema 4개 (Role / User / Session / JwtPayload) — phase-02 박힘
- phase-05 Auth Core + Security 진입 — *5 endpoint flow* (signin/signup/refresh/password-reset/email-verify) 진입 직전
- 흡수 항목 (phase.md): `ts-pattern` 도입 — AuthResult discriminated union 매칭

### 문제점

- *endpoint flow schema 없음* — spec-05-02 (auth-session) / spec-05-03 (auth-jwt) / spec-05-05/06 (flow) 가 *입력/출력 schema* 필요
- *AuthResult* 부재 — `signin()` 응답이 *success* / *mfa_required* / *error* 분기 — 단순 throw 아닌 *result union* 자연
- discriminated union 안전 처리 — ts-pattern 없으면 *exhaustiveness 직접 박아야*

### 해결 방안 (요약)

`@repo/auth-contracts` 5 신규 schema (SignIn/SignUp/Refresh/PasswordReset/EmailVerify) + `AuthResult` discriminated union (3 variant) + `MfaChallenge` interface 자리. `ts-pattern` 도입 — AuthResult 매칭 시 exhaustiveness check 자연. 본 spec 은 *schema + type* 박는 단계 — 실 구현은 spec-05-02~06.

## 🎯 요구사항

### Functional Requirements

1. **5 신규 zod schema**:
   - `SignInInput`: `{ email, password }` — Email + min(8) password
   - `SignUpInput`: `{ email, password, displayName? }` — Email + password + optional name
   - `RefreshInput`: `{ refreshToken }` — string
   - `PasswordResetRequest`: `{ email }`
   - `PasswordResetConfirm`: `{ token, newPassword }`
   - `EmailVerifyRequest`: `{ email }`
   - `EmailVerifyConfirm`: `{ token }`

2. **`AuthResult` discriminated union** (3 variant):
   ```ts
   type AuthResult =
     | { success: true; user: User; session: Session }
     | { success: false; reason: "mfa_required"; challenge: MfaChallenge }
     | { success: false; reason: "invalid_credentials" | "rate_limited" | "account_locked" | "unverified_email" };
   ```

3. **`MfaChallenge` interface 자리** (구현은 phase-07):
   - `{ challengeId: string; method: "totp" | "passkey"; expiresAt: ISO date }`
   - 실 발급/검증 로직은 spec-07-NN

4. **`ts-pattern` 도입**:
   - dependency 추가
   - test 안에서 `match()` + `exhaustive()` 시연 — AuthResult 의 3 variant 정확 처리 보장

5. **단위 테스트**:
   - 5 schema 의 parse / safeParse — valid + invalid 케이스
   - AuthResult union — ts-pattern match exhaustiveness check
   - MfaChallenge shape 검증

### Non-Functional Requirements

1. depcruise 0 violations
2. shared 패키지 — framework-agnostic 유지 (NestJS / React deps 박지 말 것)
3. zod ^4 호환 (catalog 그대로)
4. `ts-pattern` 박음 (catalog 신규)

## 🚫 Out of Scope

- 실 session/jwt 구현 — spec-05-02/03
- 실 password-reset/email-verify endpoint — spec-05-05/06
- MFA 실 구현 — phase-07
- 권한 (인가) — phase-06+ 또는 phase-09
- OAuth / Passkey schema — phase-07
- argon2 password hash — spec-05-04 (auth-security)
- email 전송 — apps/api 또는 별 spec (외부 SMTP)

## 📑 ADR 후보

- [ ] ADR 가치 있는 결정 있음
- [x] **없음** — ADR-0006 (Auth Platform), ADR-0008 (Result), ADR-0009 (AppError) 답습. 신규 ADR 가치 없음.

## ✅ Definition of Done

- [ ] catalog 에 `ts-pattern` 추가
- [ ] `@repo/auth-contracts` 에 5 신규 schema + AuthResult union + MfaChallenge 박음
- [ ] index.ts barrel export 갱신
- [ ] 단위 테스트 PASS (schema parse + ts-pattern exhaustiveness)
- [ ] `pnpm lint` / `pnpm typecheck` 그린
- [ ] `pnpm exec depcruise` 0 violations
- [ ] walkthrough.md / pr_description.md 작성 및 ship commit
- [ ] PR 생성 (base = `phase-05-auth-core-security`)
- [ ] 사용자 검토 요청 알림 완료
