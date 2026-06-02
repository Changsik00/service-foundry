# Task List: spec-12-02

> One Task = One Commit.

## Pre-flight
- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md / plan.md / task.md 작성
- [x] 백로그 업데이트 (phase-12.md spec 표 자동)
- [ ] 사용자 Plan Accept

---

## Task 1: 브랜치 + queue 패키지 + resolveQueueConfig (TDD)

### 1-1. 브랜치 + scaffold
- [x] `git checkout -b spec-12-02-queue-worker`
- [x] `pnpm new package queue backend` + tsconfig `types:["node"]` 보정 + bullmq catalog/dep + msgpackr-extract 빌드 승인(false)

### 1-2. config 테스트 (Red, throwing 스텁)
- [x] `src/config.ts` 스텁 + `src/config.test.ts`
- [x] Fail → Commit: `test(spec-12-02): scaffold backend-queue + failing config tests`

### 1-3. resolveQueueConfig 구현 (Green)
- [x] `src/config.ts`
- [x] Pass (5/5) → Commit: `feat(spec-12-02): implement resolveQueueConfig`

---

## Task 2: BullMQ 어댑터 + 포트

### 2-1. 포트 + bull 어댑터
- [x] `src/port.ts` 포트 + `src/bull.ts`(createBullProducer/startBullConsumer) + index export
- [x] typecheck + test(5)
- [x] Commit: `feat(spec-12-02): add bullmq producer/consumer adapter`

---

## Task 3: apps/worker + 통합 스모크

### 3-1. worker 앱 + redis round-trip
- [x] `apps/worker`(@apps/worker) consumer 부트 + 데모 핸들러 + SIGTERM close
- [x] `smoke-queue.sh` + `roundtrip.ts` — redis 기동 → enqueue → 핸들러 수신 → 정리
- [x] `bash ...smoke-queue.sh` → PASS + apps/worker typecheck
- [x] Commit: `feat(spec-12-02): add worker app and queue round-trip smoke`

---

## Task 4: Ship
- [x] 단위 PASS (5) + 통합 smoke PASS + typecheck
- [x] walkthrough / pr_description
- [x] Ship Commit: `docs(spec-12-02): ship walkthrough and pr description`
- [ ] Push + PR (base `phase-12-runtime`)
- [ ] 사용자 알림

---

## 진행 요약
| 항목 | 값 |
|---|---|
| 총 Task | 4 (작업 3 + Ship) |
| 예상 commit | test 1 + feat 3 + ship 1 |
| 현재 단계 | Planning |
