# Task List: spec-13-04

> One Task = One Commit. TDD = Red/Green 2 commit.

## Pre-flight
- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md / plan.md / task.md 작성
- [x] 백로그 업데이트 (phase-13.md SPEC 표 자동)
- [x] 사용자 Plan Accept

---

## Task 0: 브랜치
- [x] `git checkout -b spec-13-04-outbox` (from phase-13-api-data)

## Task 1: `@repo/backend-outbox` (TDD)
- [x] scaffold 패키지 + tsconfig `types:["node"]`
- [x] `src/index.test.ts` → Fail (6)
- [x] Commit: `test(spec-13-04): add failing tests for outbox store and relay`
- [x] `src/index.ts` (OutboxStore 포트 + memory + createOutboxRelay) → Pass (6/6)
- [x] Commit: `feat(spec-13-04): add @repo/backend-outbox (port + memory + relay)`

## Task 2: Ship
- [x] 단위 PASS (6) + typecheck 0
- [x] walkthrough.md / pr_description.md 작성
- [x] Ship Commit: `docs(spec-13-04): ship walkthrough and pr description`
- [x] Push + PR (base `phase-13-api-data`) + 알림

---

## 진행 요약
| 항목 | 값 |
|---|---|
| 총 Task | 3 (브랜치 + 작업 1 + Ship) |
| 예상 commit | test 1 + feat 1 + ship 1 (+ 계획 docs) |
| 현재 단계 | Planning |
| 마지막 업데이트 | 2026-05-31 |
