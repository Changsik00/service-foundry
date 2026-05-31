# Task List: spec-14-03

> One Task = One Commit. TDD Red/Green (타입 결합 시 단일).

## Pre-flight
- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md / plan.md / task.md 작성
- [x] 백로그 업데이트 (phase-14.md SPEC 표 자동)
- [ ] 사용자 Plan Accept

---

## Task 0: 브랜치
- [ ] `git checkout -b spec-14-03-auth-guard-verified-claims` (from phase-14-quality-cicd)

## Task 1: auth-jwt — 커스텀 claim 보존
- [ ] `JwtClaims` index signature + `narrowClaims` custom claim 보존
- [ ] `verify.test.ts` verified role 보존 단언
- [ ] Commit: `feat(spec-14-03): preserve verified custom claims in JwtClaims`

## Task 2: nestjs-auth — guard 가 verified role 사용
- [ ] `auth.guard.ts` `result.value.role` + `decodeJwt` 제거
- [ ] `auth.guard.test.ts` 보강
- [ ] Commit: `fix(spec-14-03): read role from verified claims (drop decodeJwt footgun)`

## Task 3: Ship
- [ ] 전체 단위 PASS + typecheck 0
- [ ] walkthrough / pr_description
- [ ] Ship Commit + Push + PR (base `phase-14-quality-cicd`) + 알림 + CI green

---

## 진행 요약
| 항목 | 값 |
|---|---|
| 총 Task | 4 (브랜치 + auth-jwt + guard + Ship) |
| 예상 commit | feat 1 + fix 1 + ship 1 |
| 현재 단계 | Planning |
| 마지막 업데이트 | 2026-05-31 |
