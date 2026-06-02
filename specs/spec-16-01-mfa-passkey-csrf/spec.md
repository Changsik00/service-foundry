# spec-16-01: MFA/passkey 상태변경 endpoint CSRF 보호

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-16-01` |
| **Phase** | `phase-16` |
| **Branch** | `spec-16-01-mfa-passkey-csrf` |
| **상태** | Planning |
| **타입** | Fix (보안 갭 배선) |
| **Integration Test Required** | yes (e2e CSRF 우회 차단) |
| **작성일** | 2026-06-02 |
| **소유자** | dennis |

## 📋 배경 및 문제 정의

### 현재 상황
phase-15(spec-15-02)에서 CSRF double-submit(`CsrfGuard`, csrf_id binding — ADR-0021)을 auth 의 상태변경 8개 endpoint(signin/signup/signout/refresh + password-reset/email-verify 계열)에 배선했다. 그러나 **MFA/passkey 의 상태변경 POST 8개는 사용자 합의로 후속 이월**되어 현재 CSRF 미보호다 (phase-15 회고 W5).

대상 8개 (`grep @Post` 확인):
- `auth/mfa/totp`: `enroll`(AuthGuard), `enroll/confirm`(AuthGuard), **`verify`(미인증)**, `disable`(AuthGuard)
- `auth/passkey`: `register/options`(AuthGuard), `register/verify`(AuthGuard), `authenticate/options`(미인증), **`authenticate/verify`(미인증)**

### 문제점
- **`mfa/totp/verify`·`passkey/authenticate/verify` 는 미인증 로그인 완료 endpoint** — 세션/토큰을 발급하는 상태변경이라 CSRF 공격면이 가장 크다. 그런데 이 둘은 AuthGuard 도 없어(미인증 흐름) 무방비.
- phase-15 성공기준1 문언("상태변경 endpoint CSRF")의 잔여 미충족분. ADR-0021 의 csrf_id 메커니즘은 session 비의존이라 미인증 endpoint 에도 그대로 적용 가능한데 배선만 안 됐다.

### 해결 방안 (요약)
8개 endpoint 에 기존 `CsrfGuard` 를 배선한다(AuthGuard 있는 곳은 `@UseGuards(AuthGuard, CsrfGuard)` 스택, 없는 곳은 `@UseGuards(CsrfGuard)`). 신규 메커니즘 없이 ADR-0021 재사용. e2e 로 헤더 누락 → 403, csrf 동반 → 정상을 검증하고, 기존 MFA/passkey e2e 슬라이스를 csrf 동반(`postCsrf` 헬퍼)으로 갱신한다.

## 🎯 요구사항

### Functional Requirements
1. MFA 4개(`enroll`/`enroll/confirm`/`verify`/`disable`) + passkey 4개(`register/options`·`register/verify`·`authenticate/options`·`authenticate/verify`) POST 가 CSRF 검증 미통과 시 **403** 거부.
2. AuthGuard 가 있던 endpoint 는 인증 + CSRF 둘 다 통과해야 동작(가드 스택으로 기존 401/403 동작 보존).
3. csrf 동반 시 기존 기능(enroll/verify/disable 등) 동작 불변.

### Non-Functional Requirements
1. 신규 CSRF 메커니즘 도입 금지 — 기존 `CsrfGuard`(ADR-0021) 재사용.
2. 기존 MFA/passkey e2e 슬라이스가 csrf 동반으로 갱신되어 GREEN 유지(회귀 0).

## 🚫 Out of Scope
- 프론트(web-next)에서 MFA/passkey 호출 시 X-Csrf-Token 동반 — spec-16-03(W6).
- options 류를 CSRF 대상에서 뺄지 여부 재논의 — 본 spec 은 상태변경 보수적 전수 적용(8개 모두). challenge 발급도 상태 기록이므로 포함.
- MFA/passkey 비즈니스 로직 변경.

## 📑 ADR 후보
- [x] 없음 (ADR-0021 재사용, 신규 결정 없음)

## 🔗 관련 문서 (Related)
- 관련 ADR: [[ADR-0021]] (csrf-binding-strategy)
- 관련 RCA: [[RCA-003]] (배선 검증)
- 관련: phase-15 회고 W5, `docs/review/2026-06-01-wiring-audit.md`

## ✅ Definition of Done
- [ ] 8개 endpoint `CsrfGuard` 배선, 헤더 누락 → 403 e2e
- [ ] 기존 MFA/passkey e2e 슬라이스 csrf 동반 갱신 → GREEN
- [ ] walkthrough/pr_description ship + push + PR (base: phase-16-security-hardening)
- [ ] 사용자 검토 알림
