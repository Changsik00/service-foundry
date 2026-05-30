# Task List: spec-11-03

> One Task = One Commit.

## Pre-flight
- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md / plan.md / task.md 작성
- [x] 백로그 업데이트 (phase-11.md spec 표 자동)
- [ ] 사용자 Plan Accept

---

## Task 1: 브랜치 + createAuthMetrics (TDD)

### 1-1. 브랜치 생성
- [ ] `git checkout -b spec-11-03-metrics-endpoint` (from `phase-11-observability`)

### 1-2. metrics 테스트 (Red, throwing 스텁 — typecheck 게이트)
- [x] `prom-client` catalog + backend-observability dep 추가
- [x] `src/metrics.ts` throwing 스텁 + `src/metrics.test.ts`
- [x] Fail → Commit: `test(spec-11-03): add failing tests for createAuthMetrics`

### 1-3. createAuthMetrics 구현 (Green)
- [x] `src/metrics.ts` (prom-client Registry + 카운터 3종) + index export
- [x] Pass (10/10) → Commit: `feat(spec-11-03): implement createAuthMetrics (prom-client)`

---

## Task 2: apps/api /metrics 엔드포인트 + provider

### 2-1. 엔드포인트 + DI
- [x] `auth-metrics.provider.ts`(AUTH_METRICS) + `metrics.controller.ts`(GET /metrics) + `observability.module.ts`(@Global)
- [x] `app.module.ts` 등록
- [x] typecheck
- [x] Commit: `feat(spec-11-03): add apps/api /metrics endpoint`

---

## Task 3: 로그인 카운터 wiring + prometheus scrape

### 3-1. auth controller wiring + scrape config
- [x] `auth.controller.ts` signin — attempt/success/failure 카운터 + 테스트 mock provider
- [x] `prometheus.yml` apps/api scrape target (host.docker.internal:2026)
- [x] typecheck + compose config + auth.controller 테스트(10/10)
- [x] Commit: `feat(spec-11-03): wire login counters and prometheus scrape target`

---

## Task 4: Ship
- [x] 단위 PASS (10) + auth.controller 10
- [x] typecheck + compose config 통과
- [x] walkthrough / pr_description
- [x] Ship Commit: `docs(spec-11-03): ship walkthrough and pr description`
- [ ] Push + PR (base `phase-11-observability`)
- [ ] 사용자 알림

---

## 진행 요약
| 항목 | 값 |
|---|---|
| 총 Task | 4 (작업 3 + Ship) |
| 예상 commit | test 1 + feat 3 + ship 1 |
| 현재 단계 | Planning |
