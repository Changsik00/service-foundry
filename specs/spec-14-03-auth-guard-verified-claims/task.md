# Task List: spec-14-03

> One Task = One Commit. TDD Red/Green (타입 결합 시 단일).

## Pre-flight
- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md / plan.md / task.md 작성
- [x] 백로그 업데이트 (phase-14.md SPEC 표 자동)
- [x] 사용자 Plan Accept

---

## Task 0: 브랜치
- [x] `git checkout -b spec-14-03-auth-guard-verified-claims`

## Task 1: auth-jwt — 커스텀 claim 보존
- [x] JwtClaims index signature + narrowClaims 보존 + verify.test 단언 (26/26)
- [x] Commit (feat)

## Task 2: nestjs-auth — guard 가 verified role 사용
- [x] guard result.value.role + decodeJwt 제거 (10/10)
- [x] Commit (fix)

## Task 3: Ship
- [x] walkthrough / pr_description
- [x] Ship Commit + Push + PR + CI green

---

## 진행 요약
| 항목 | 값 |
|---|---|
| 총 Task | 4 (브랜치 + auth-jwt + guard + Ship) |
| 예상 commit | feat 1 + fix 1 + ship 1 |
| 현재 단계 | Planning |
| 마지막 업데이트 | 2026-05-31 |
