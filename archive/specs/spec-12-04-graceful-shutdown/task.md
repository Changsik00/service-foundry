# Task List: spec-12-04

> One Task = One Commit.

## Pre-flight
- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md / plan.md / task.md 작성
- [x] 백로그 업데이트 (phase-12.md spec 표 자동)
- [ ] 사용자 Plan Accept

---

## Task 1: 브랜치 + lifecycle (TDD)

### 1-1. 브랜치 + scaffold
- [x] `git checkout -b spec-12-04-graceful-shutdown`
- [x] `pnpm new package lifecycle backend` + tsconfig `types:["node"]`

### 1-2. lifecycle 테스트 (Red, throwing 스텁)
- [x] `src/index.ts` 스텁 + `src/index.test.ts`
- [x] Fail → Commit: `test(spec-12-04): scaffold backend-lifecycle + failing tests`

### 1-3. createLifecycle 구현 (Green)
- [x] `src/index.ts` (readiness flag + onShutdown + shutdown timeout, idempotent)
- [x] Pass (5/5) → Commit: `feat(spec-12-04): implement lifecycle (readiness + shutdown drain)`

---

## Task 2: apps/api 배선 — ready/live + SIGTERM

### 2-1. provider + health 엔드포인트 + 시그널
- [x] `apps/api` dep + `lifecycle.provider.ts`(LIFECYCLE) + @Global LifecycleModule
- [x] `health.controller.ts` — `/health/live`, `/health/ready`(503 분기)
- [x] `main.ts` — onShutdown(app.close) + SIGTERM/SIGINT → shutdown → exit
- [x] health controller 테스트 추가(4) + typecheck
- [x] Commit: `feat(spec-12-04): add readiness/liveness endpoints and SIGTERM drain`

---

## Task 3: Ship
- [x] 단위 lifecycle(5) + health(4) PASS + typecheck
- [x] walkthrough / pr_description
- [x] Ship Commit: `docs(spec-12-04): ship walkthrough and pr description`
- [ ] Push + PR (base `phase-12-runtime`)
- [ ] 사용자 알림

---

## 진행 요약
| 항목 | 값 |
|---|---|
| 총 Task | 3 (작업 2 + Ship) |
| 예상 commit | test 1 + feat 2 + ship 1 |
| 현재 단계 | Planning |
