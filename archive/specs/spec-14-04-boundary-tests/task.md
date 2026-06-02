# Task List: spec-14-04

> One Task = One Commit. 테스트 전용 (characterization).

## Pre-flight
- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md / plan.md / task.md 작성
- [x] 백로그 업데이트 (phase-14.md SPEC 표 자동)
- [x] 사용자 Plan Accept

---

## Task 0: 브랜치
- [x] `git checkout -b spec-14-04-boundary-tests`

## Task 1: utils fromPromise
- [x] fromPromise resolve/reject/sync-throw (utils 19)
- [x] Commit

## Task 2: backend/http-client 4xx + POST retry
- [x] 404 BAD_REQUEST 비-retry + POST 기본/명시 retry (http-client 14)
- [x] Commit

## Task 3: logger
- [x] generateRequestId 유일성 + middleware custom header/next (logger 10). ※응답헤더는 미들웨어가 미수행→드롭(characterization)
- [x] Commit

## Task 4: Ship
- [x] walkthrough / pr_description
- [x] Ship Commit + Push + PR + CI green

---

## 진행 요약
| 항목 | 값 |
|---|---|
| 총 Task | 5 (브랜치 + 3 테스트 + Ship) |
| 예상 commit | test 3 + ship 1 |
| 현재 단계 | Planning |
| 마지막 업데이트 | 2026-05-31 |
