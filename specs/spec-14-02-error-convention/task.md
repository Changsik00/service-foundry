# Task List: spec-14-02

> One Task = One Commit. TDD 해당 항목은 Red/Green.

## Pre-flight
- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md / plan.md / task.md 작성
- [x] 백로그 업데이트 (phase-14.md SPEC 표 자동)
- [x] 사용자 Plan Accept

---

## Task 0: 브랜치
- [x] `git checkout -b spec-14-02-error-convention`

## Task 1: ADR-0020
- [x] ADR-0020 작성
- [x] Commit (docs)

## Task 2: P0 — silent confirm → outcome union (TDD)
- [x] confirm → ConfirmOutcome union + 테스트 outcome 단언 (11/11)
- [x] Commit (refactor, test+impl 타입결합 단일)

## Task 3: P2 — plain Error → AppError
- [x] 6곳 → AppError (INTERNAL/NOT_FOUND). 4 패키지 75 tests green, 비파괴
- [x] Commit (refactor)

## Task 4: Ship
- [x] walkthrough / pr_description
- [x] Ship Commit + Push + PR + CI green 확인

---

## 진행 요약
| 항목 | 값 |
|---|---|
| 총 Task | 5 (브랜치 + ADR + P0 + P2 + Ship) |
| 예상 commit | docs 1 + test 1 + refactor 2 + ship 1 |
| 현재 단계 | Planning |
| 마지막 업데이트 | 2026-05-31 |
