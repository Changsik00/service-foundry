# Task List: spec-13-01

> One Task = One Commit.

## Pre-flight
- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md / plan.md / task.md 작성
- [x] 백로그 업데이트 (phase-13.md spec 표 자동)
- [ ] 사용자 Plan Accept

---

## Task 1: 브랜치 + cursor 계약 (TDD)

### 1-1. 브랜치 생성
- [x] `git checkout -b spec-13-01-pagination-contracts`

### 1-2. 테스트 (Red)
- [x] `pagination.test.ts` cursor 코덱 + query + envelope 테스트 추가
- [x] 실행 → Fail (codec 3 fail / 8 pass)
- [x] Commit: `test(spec-13-01): add failing tests for cursor pagination contracts`

### 1-3. 구현 (Green)
- [x] `pagination.ts` — query 스키마 + codec(btoa/atob 유니코드 안전) + envelope
- [x] 실행 → Pass (14/14) + typecheck
- [x] Commit: `feat(spec-13-01): add cursor pagination contracts`

---

## Task 2: Ship
- [x] 단위 PASS (14) + typecheck
- [x] walkthrough / pr_description
- [x] Ship Commit: `docs(spec-13-01): ship walkthrough and pr description`
- [ ] Push + PR (base `phase-13-api-data`)
- [ ] 사용자 알림

---

## 진행 요약
| 항목 | 값 |
|---|---|
| 총 Task | 2 (작업 1 + Ship) |
| 예상 commit | test 1 + feat 1 + ship 1 |
| 현재 단계 | Planning |
