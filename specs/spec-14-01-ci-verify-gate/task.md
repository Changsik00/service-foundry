# Task List: spec-14-01

> One Task = One Commit. (CI 설정 — TDD red/green 비해당.)

## Pre-flight
- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md / plan.md / task.md 작성
- [x] 백로그 업데이트 (phase-14.md SPEC 표 자동)
- [x] 사용자 Plan Accept

---

## Task 0: 브랜치
- [x] `git checkout -b spec-14-01-ci-verify-gate`

## Task 1: verify 워크플로
- [x] `.github/workflows/verify.yml` (postgres service + migrate)
- [x] fix: NOTIFIER mock 누락(confirm 테스트 8) 보정
- [x] 로컬 동등 그린: 129/129 (PG 5434 + migrate)
- [x] Commit: fix + feat

## Task 2: Ship
- [x] walkthrough.md / pr_description.md 작성
- [x] Ship Commit
- [x] Push + PR (base `phase-14-quality-cicd`)
- [x] **본 PR 의 verify 워크플로 green 확인** (run 26701277137, 2m8s ✅)
- [x] 사용자 알림

---

## 진행 요약
| 항목 | 값 |
|---|---|
| 총 Task | 3 (브랜치 + 워크플로 + Ship) |
| 예상 commit | feat 1 + ship 1 |
| 현재 단계 | Planning |
| 마지막 업데이트 | 2026-05-31 |
