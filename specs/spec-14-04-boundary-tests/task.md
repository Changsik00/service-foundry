# Task List: spec-14-04

> One Task = One Commit. 테스트 전용 (characterization).

## Pre-flight
- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md / plan.md / task.md 작성
- [x] 백로그 업데이트 (phase-14.md SPEC 표 자동)
- [ ] 사용자 Plan Accept

---

## Task 0: 브랜치
- [ ] `git checkout -b spec-14-04-boundary-tests` (from phase-14-quality-cicd)

## Task 1: utils fromPromise
- [ ] `fromPromise` resolve→ok / reject→err 테스트
- [ ] Commit: `test(spec-14-04): cover fromPromise (resolve/reject)`

## Task 2: backend/http-client 4xx + POST retry
- [ ] 404→AppError(BAD_REQUEST) 비-retry + POST 정책 테스트
- [ ] Commit: `test(spec-14-04): cover 4xx BAD_REQUEST + POST retry policy`

## Task 3: logger
- [ ] generateRequestId + requestIdMiddleware 응답헤더/next 테스트
- [ ] Commit: `test(spec-14-04): cover generateRequestId + requestIdMiddleware`

## Task 4: Ship
- [ ] 전체 단위 PASS + typecheck 0
- [ ] walkthrough / pr_description
- [ ] Ship Commit + Push + PR (base `phase-14-quality-cicd`) + 알림 + CI green

---

## 진행 요약
| 항목 | 값 |
|---|---|
| 총 Task | 5 (브랜치 + 3 테스트 + Ship) |
| 예상 commit | test 3 + ship 1 |
| 현재 단계 | Planning |
| 마지막 업데이트 | 2026-05-31 |
