# @repo/backend-queue

> `Producer`/`Consumer` 포트 인터페이스와 BullMQ Redis 기반 어댑터를 제공하는 framework-agnostic 잡 큐 패키지.

## 설치 / import
```ts
import { createBullProducer, startBullConsumer, resolveQueueConfig } from "@repo/backend-queue";
```

## 핵심 API
- `createBullProducer({ queueName, connection })` — BullMQ 기반 잡 발행 팩토리
- `startBullConsumer({ queueName, connection, handler })` — BullMQ 기반 잡 소비 워커 시작
- `resolveQueueConfig({ redisUrl })` — 환경 변수에서 큐 설정 정규화

## 자세히
- 레퍼런스: [`docs/reference/packages/backend-queue.md`](../../../docs/reference/packages/backend-queue.md)
- 동작 원리: [`docs/explainers/backend/queue-worker-bullmq.md`](../../../docs/explainers/backend/queue-worker-bullmq.md)
