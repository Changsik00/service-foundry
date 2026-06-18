# Walkthrough: spec-16-01

> MFA/passkey 상태변경 endpoint CSRF 보호. 작업 기록 + 결정 + 검증.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| CSRF 메커니즘 | 신규 / ADR-0021 재사용 | ADR-0021 재사용 | csrf_id double-submit 이 session 비의존 → 미인증 endpoint(verify·authenticate) 까지 커버 |
| 가드 스택 | 분리 / 스택 | `@UseGuards(AuthGuard, CsrfGuard)` | AuthGuard 먼저 평가(미인증 401) 후 CsrfGuard(403). register/options 인증없음 테스트가 그대로 401 유지됨 |
| 적용 범위 | 상태변경만 / options 포함 | 8개 전수(options 포함) | challenge 발급도 서버 상태(challenge 저장) 기록 → 보수적 보호 |
| e2e 슬라이스 갱신 | 분리 commit / 결합 | 결합(1 commit) | 가드가 기존 슬라이스를 깨므로 분리 시 중간 red (spec-15-02 선례, No-Test-No-Commit) |

### ADR 승격 가이드
- [x] 없음 (ADR-0021 재사용, 신규 결정 없음)

## 🧪 검증 결과

### 1. 통합 테스트 (Integration Test Required = yes)
- **명령**: `DATABASE_URL=...5434/test pnpm --filter @apps/api test`
- **결과**: ✅ **104/104 PASS** (+2 vs phase-15 의 102)
- **신규**: "MFA/passkey CSRF 게이트" describe — csrf 없는 `mfa/totp/verify`·`passkey/authenticate/verify` → 403.
- **회귀**: 기존 "MFA TOTP 수직 슬라이스"(7)·"Passkey 수직 슬라이스"(6) 를 `postCsrf` 동반으로 갱신 → GREEN. register/options 인증없음→401 은 AuthGuard 우선이라 csrf 없이 유지.

#### TDD Red→Green
- Red: 배선 전 csrf 없는 verify 는 핸들러 도달 → 401 → 기대 403 과 불일치(2건 Fail).
- Green: 8개 endpoint CsrfGuard 배선 후 → 403 (핸들러 전 차단).

### 2. 게이트
- `pnpm turbo run lint typecheck test knip depcruise` → **136/136 successful**.

### 3. 수동 검증 (대조)
- csrf 없는 `POST /auth/mfa/totp/verify` → 403 (이전 401: 핸들러 도달 후 challenge 검증 실패였음 → 이제 가드가 선차단).

## 🔍 발견 사항
- 가드 스택 순서 덕에 `register/options 인증없음 → 401` 테스트가 csrf 없이도 통과 — AuthGuard 가 CsrfGuard 보다 먼저 단락. 미인증 endpoint(verify/authenticate)만 csrf 단독 가드.
- 8개 중 `mfa/totp/verify`·`passkey/authenticate/verify` 가 미인증 로그인 완료 지점이라 가장 중요한 보호 대상이었음.

## 🚧 이월 항목
- 프론트(web-next) MFA/passkey 호출에 X-Csrf-Token 동반 — spec-16-03(W6).

## 🔗 관련 문서 (Related)
- 관련 ADR: [[ADR-0021]] (csrf-binding-strategy)
- 관련 RCA: [[RCA-003]]
- 관련: phase-15 회고 W5, `docs/review/2026-06-01-wiring-audit.md`

## 📅 메타
| 항목 | 값 |
|---|---|
| **작성자** | Agent + dennis |
| **작성 기간** | 2026-06-02 |
| **최종 commit** | `6559a12` |
