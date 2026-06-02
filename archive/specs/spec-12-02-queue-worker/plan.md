# Implementation Plan: spec-12-02

## 📋 Branch Strategy
- 신규 브랜치: `spec-12-02-queue-worker` (from `phase-12-runtime`)
- base 모드: PR target = `phase-12-runtime`

## 🛑 사용자 검토 필요
> [!IMPORTANT]
> - [ ] 큐 첫 어댑터 = **BullMQ(redis)** (사용자 결정). 포트로 추상화 → 어댑터 교체 가능.
> - [ ] `apps/worker` 신규 앱 (생성기 미지원 타입 → 수기). 생성기 worker 타입은 후속.
> - [ ] bullmq catalog 추가.

> [!WARNING]
> - [ ] 통합 테스트가 redis(docker) 기동 → 포트 충돌 시 override. 테스트 후 producer/consumer/connection close 필수(누수 방지).
> - [ ] backend 패키지 tsconfig `types:["node"]` 필요 (생성기 갭 — notification 처럼 보정).

## 🎯 핵심 전략

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| 포트 | `@repo/backend-queue` Producer/Consumer (bullmq 비노출) | core, 어댑터 교체 |
| 어댑터 | `createBullProducer`/`startBullConsumer` | BullMQ/redis |
| 설정 | `resolveQueueConfig(env)` 순수 | REDIS_URL/host/port |
| worker | `apps/worker` consumer 부트(데모 핸들러) | async 처리 프로세스 |
| 테스트 | 단위(config) + 통합(redis round-trip, 직접 어댑터) | full worker 부트 회피 |

### 📑 ADR 후보
- [x] `queue-bullmq` — 머지 시 검토.

## 📂 Proposed Changes

### @repo/backend-queue (신규, 생성기 scaffold + tsconfig types:node 보정)
- [NEW] `src/config.ts` (`resolveQueueConfig`) (+ `.test.ts`)
- [NEW] `src/bull.ts` — `createBullProducer`, `startBullConsumer` (bullmq)
- [NEW] `src/index.ts` — 포트 타입(`Producer`/`Consumer`/`JobHandler`) + export
- package.json: `bullmq` (catalog)

### apps/worker (신규 앱, 수기)
- [NEW] `apps/worker/package.json`(@apps/worker, tsx) + tsconfig + `src/main.ts`(startBullConsumer + 데모 핸들러)

### 통합 테스트
- [NEW] `packages/backend/queue/smoke-queue.sh` (+ ts) — redis 기동 → producer.enqueue → consumer 핸들러 수신 확인 → close/정리

### 루트
- [MODIFY] pnpm-workspace.yaml — `bullmq` catalog

## 🧪 검증 계획

### 단위
```bash
pnpm --filter @repo/backend-queue test
```
`resolveQueueConfig` (REDIS_URL/host/port/기본값).

### 통합 (Integration Test Required = yes)
```bash
bash packages/backend/queue/smoke-queue.sh
```
redis 기동(포트 override) → enqueue → 핸들러 1회 수신 → 정리.

### 정적
```bash
pnpm --filter @apps/worker typecheck
```

## 🔁 Rollback
- 신규 패키지 + apps/worker + bullmq dep. 제거로 롤백. 기존 앱 영향 없음.

## 📦 Deliverables
- [ ] task.md 작성
- [ ] Plan Accept
- [ ] (실행 후) walkthrough / pr_description ship
