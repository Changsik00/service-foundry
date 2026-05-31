# Task List: spec-14-02

> One Task = One Commit. TDD 해당 항목은 Red/Green.

## Pre-flight
- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md / plan.md / task.md 작성
- [x] 백로그 업데이트 (phase-14.md SPEC 표 자동)
- [ ] 사용자 Plan Accept

---

## Task 0: 브랜치
- [ ] `git checkout -b spec-14-02-error-convention` (from phase-14-quality-cicd)

## Task 1: ADR-0020
- [ ] `docs/adr/0020-error-handling-convention.md` — 결정 트리 + 예시 + 안티패턴
- [ ] Commit: `docs(spec-14-02): add ADR-0020 error-handling convention`

## Task 2: P0 — silent confirm → outcome union (TDD)
- [ ] `*.confirm.service.test.ts` outcome 단언으로 변경 → Fail
- [ ] Commit: `test(spec-14-02): assert confirm outcome union`
- [ ] `email-verify/password-reset.service.ts` confirm 반환 union + 컨트롤러 200 고정 유지 → Pass
- [ ] Commit: `refactor(spec-14-02): confirm returns outcome union (enumeration-safe preserved)`

## Task 3: P2 — plain Error → AppError
- [ ] 6곳 `throw new Error` → `AppError(INTERNAL)` (+ package.json @repo/errors dep 필요시)
- [ ] 관련 테스트 조정(AppError code 단언)
- [ ] Commit: `refactor(spec-14-02): plain Error → AppError(INTERNAL) at invariant sites`

## Task 4: Ship
- [ ] 전체 단위 PASS + typecheck 0
- [ ] walkthrough / pr_description
- [ ] Ship Commit + Push + PR (base `phase-14-quality-cicd`) + 알림 + CI green 확인

---

## 진행 요약
| 항목 | 값 |
|---|---|
| 총 Task | 5 (브랜치 + ADR + P0 + P2 + Ship) |
| 예상 commit | docs 1 + test 1 + refactor 2 + ship 1 |
| 현재 단계 | Planning |
| 마지막 업데이트 | 2026-05-31 |
