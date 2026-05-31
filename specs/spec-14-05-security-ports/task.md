# Task List: spec-14-05

> One Task = One Commit. TDD Red/Green.

## Pre-flight
- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md / plan.md / task.md 작성
- [x] 백로그 업데이트 (phase-14.md SPEC 표 자동)
- [x] 사용자 Plan Accept

---

## Task 0: 브랜치
- [x] `git checkout -b spec-14-05-security-ports`

## Task 1: `@repo/backend-rate-limit` (TDD)
- [x] scaffold + test → Fail (5)
- [x] Commit (test, 양 포트 묶음)
- [x] createMemoryRateLimiter → Pass (5/5)
- [x] Commit (feat)

## Task 2: `@repo/backend-secrets` (TDD)
- [x] scaffold + test → Fail (4) (test commit 에 묶음)
- [x] env/memory SecretsProvider → Pass (4/4)
- [x] Commit (feat)

## Task 3: Ship
- [x] 단위 PASS (9) + typecheck 0
- [x] walkthrough / pr_description
- [x] Ship Commit + Push + PR + CI green

---

## 진행 요약
| 항목 | 값 |
|---|---|
| 총 Task | 4 (브랜치 + 2 포트 + Ship) |
| 예상 commit | test 2 + feat 2 + ship 1 |
| 현재 단계 | Planning |
| 마지막 업데이트 | 2026-05-31 |
