# Task List: spec-16-01

> One Task = One Commit. 매 commit 직후 체크박스 갱신.

## Pre-flight
- [x] Spec ID 확정 및 디렉토리 생성 (sdd spec new)
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성
- [x] phase.md SPEC 표 갱신 (sdd 자동)
- [x] 사용자 Plan Accept

---

## Task 1: 브랜치 + 문서 커밋
- [ ] `git checkout -b spec-16-01-mfa-passkey-csrf` (phase base 에서)
- [ ] Commit: `docs(spec-16-01): add spec/plan/task`

## Task 2: MFA/passkey CsrfGuard 배선 + e2e (TDD)
- [ ] Red: `auth.e2e.test.ts` 에 "MFA/passkey CSRF 게이트" describe 추가 — csrf 없이 `POST /auth/mfa/totp/verify` → 403, `passkey/authenticate/verify` → 403. 현재 배선 전이라 Fail(현재 401/400) 확인.
- [ ] Green: `mfa.controller.ts` 4개 + `passkey.controller.ts` 4개에 `CsrfGuard` 배선 (AuthGuard 있는 곳은 스택). `CsrfGuard` import.
- [ ] 기존 "MFA TOTP 수직 슬라이스"·"Passkey 수직 슬라이스" 호출을 `postCsrf` 동반으로 갱신 (회귀 GREEN).
- [ ] 검증: `DATABASE_URL=... pnpm --filter @apps/api test` PASS
- [ ] Commit: `fix(spec-16-01): guard MFA/passkey state-changing endpoints with CsrfGuard`

> 배선+e2e갱신을 한 commit 으로 결합 (가드가 기존 e2e 를 깨므로 분리 시 중간 red — spec-15-02 선례, No-Test-No-Commit).

## Task 3: Ship
- [ ] 게이트: `pnpm turbo run lint typecheck test knip depcruise` PASS (test 는 PG 필요 → DATABASE_URL)
- [ ] walkthrough.md / pr_description.md 작성
- [ ] Ship commit: `docs(spec-16-01): ship walkthrough and pr description`
- [ ] Push + PR (base: `phase-16-security-hardening`)
- [ ] 사용자 알림 (PR URL)

---

## 진행 요약
| 항목 | 값 |
|---|---|
| **총 Task 수** | 3 (ship 포함) |
| **예상 commit 수** | 2 (fix + ship) |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-06-02 |
