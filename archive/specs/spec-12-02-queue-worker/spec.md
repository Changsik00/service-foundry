# spec-12-02: Job Queue + Worker (BullMQ)

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-12-02` |
| **Phase** | `phase-12` |
| **Branch** | `spec-12-02-queue-worker` |
| **상태** | Planning |
| **타입** | Feature |
| **Integration Test Required** | yes (redis round-trip) |
| **작성일** | 2026-05-31 |
| **소유자** | dennis |

## 📋 배경 및 문제 정의

### 현재 상황
async 백그라운드 작업(이메일 발송, 후처리 등)을 돌릴 큐/worker 가 없다. compose 에 redis 는 있으나 앱이 사용하지 않는다.

### 문제점
- 동기 요청 경로에서 무거운 작업을 처리할 수밖에 없어 지연/실패 전파.
- worker 프로세스·큐 추상화 부재.

### 해결 방안 (요약)
`@repo/backend-queue`(core) 에 **Producer/Consumer 포트 + BullMQ 어댑터** + `resolveQueueConfig(env)`(redis 연결, 순수)를 제공. `apps/worker`(신규 앱)가 consumer 를 부트해 작업을 처리한다. 큐는 포트로 추상화해 어댑터 교체 가능(첫 어댑터 = BullMQ/redis, 사용자 결정).

## 🎯 요구사항

### Functional Requirements
1. `@repo/backend-queue` — `Producer`(enqueue/close) + `Consumer`(close) 포트 + `JobHandler<T>` 타입.
2. BullMQ 어댑터: `createBullProducer(queue, conn)` / `startBullConsumer(queue, handlers, conn)`.
3. `resolveQueueConfig(env)` — `REDIS_URL` 또는 host/port(기본 localhost:6379) 해석 (순수, 단위 테스트).
4. `apps/worker` — `@apps/worker`, consumer 부트(데모 핸들러 등록), tsx 실행.
5. enqueue → consume round-trip 통합 테스트 (redis).
6. 포트는 framework-agnostic (core). bullmq 는 backend 라이브러리(허용, ADR-0015 는 framework 의존만 금지).

### Non-Functional Requirements
1. redis 연결은 env 설정 — 미설정 시 기본값(localhost:6379).
2. worker 는 graceful 종료 가능하게 close 제공 (graceful shutdown 통합은 12-04).
3. bullmq catalog 추가.

## 🚫 Out of Scope
- 재시도/우선순위/스케줄 등 BullMQ 고급 기능 튜닝 — 기본 enqueue/process 까지.
- apps/api 에서 실제 작업 enqueue 배선(예: notification 비동기화) — 후속/12-04 이후.
- caching(12-03), graceful shutdown(12-04).
- 생성기 `worker` 타입 — apps/worker 수기 생성, 생성기 확장은 후속.

## 📑 ADR 후보
- [x] 있음 → `queue-bullmq` (decision/tradeoff) — pg-boss 대비 BullMQ(redis) 채택. 머지 시 검토.
- [ ] 없음

## 🔗 관련 문서 (Related)
- 관련 phase: `backlog/phase-12.md` (§성공 기준 2, §시나리오 2)
- 직전 spec: spec-12-01 (notification-port)
- 관련 ADR: ADR-0015 (core 경계)

## ✅ Definition of Done
- [ ] `resolveQueueConfig` 단위 테스트 PASS
- [ ] 통합: redis 기동 → enqueue → consumer 핸들러 처리 round-trip 확인
- [ ] `apps/worker` 부트 + typecheck
- [ ] walkthrough / pr_description ship
- [ ] push + PR (base `phase-12-runtime`)
- [ ] 사용자 알림
