# Task List: spec-14-05

> One Task = One Commit. TDD Red/Green.

## Pre-flight
- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md / plan.md / task.md 작성
- [x] 백로그 업데이트 (phase-14.md SPEC 표 자동)
- [ ] 사용자 Plan Accept

---

## Task 0: 브랜치
- [ ] `git checkout -b spec-14-05-security-ports` (from phase-14-quality-cicd)

## Task 1: `@repo/backend-rate-limit` (TDD)
- [ ] scaffold(types:node) + test(허용/차단/리셋/cost/키독립) → Fail
- [ ] Commit: `test(spec-14-05): add failing tests for rate limiter`
- [ ] `RateLimiter` + `createMemoryRateLimiter` → Pass
- [ ] Commit: `feat(spec-14-05): add @repo/backend-rate-limit (port + memory)`

## Task 2: `@repo/backend-secrets` (TDD)
- [ ] scaffold + test(env/memory get·require·없음→AppError) → Fail
- [ ] Commit: `test(spec-14-05): add failing tests for secrets provider`
- [ ] `SecretsProvider` + env/memory 어댑터 → Pass
- [ ] Commit: `feat(spec-14-05): add @repo/backend-secrets (port + env/memory)`

## Task 3: Ship
- [ ] 전체 단위 PASS + typecheck 0
- [ ] walkthrough / pr_description
- [ ] Ship Commit + Push + PR (base `phase-14-quality-cicd`) + 알림 + CI green

---

## 진행 요약
| 항목 | 값 |
|---|---|
| 총 Task | 4 (브랜치 + 2 포트 + Ship) |
| 예상 commit | test 2 + feat 2 + ship 1 |
| 현재 단계 | Planning |
| 마지막 업데이트 | 2026-05-31 |
