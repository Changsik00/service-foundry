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
- [x] `git checkout -b spec-16-01-mfa-passkey-csrf` (phase base 에서)
- [x] Commit: `docs(spec-16-01): add spec/plan/task`

## Task 2: MFA/passkey CsrfGuard 배선 + e2e (TDD)
- [x] Red: "MFA/passkey CSRF 게이트" describe 추가 — csrf 없는 verify → 403. 배선 전 401 로 Fail 확인.
- [x] Green: `mfa.controller.ts` 4개 + `passkey.controller.ts` 4개 `CsrfGuard` 배선 (AuthGuard 있는 곳 스택).
- [x] 기존 MFA/passkey 슬라이스 `postCsrf` 동반 갱신 (register/options 인증없음→401 은 AuthGuard 우선이라 유지).
- [x] 검증: `pnpm --filter @apps/api test` → 104/104 PASS
- [x] Commit: `fix(spec-16-01): guard MFA/passkey ...` (6559a12)

> 배선+e2e갱신을 한 commit 으로 결합 (가드가 기존 e2e 를 깨므로 분리 시 중간 red — spec-15-02 선례, No-Test-No-Commit).

## Task 3: Ship
- [x] 게이트: `pnpm turbo run lint typecheck test knip depcruise` PASS (136/136)
- [x] walkthrough.md / pr_description.md 작성
- [x] Ship commit: `docs(spec-16-01): ship walkthrough and pr description`
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
