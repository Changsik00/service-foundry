---
type: reference
aliases: ["@repo/backend-queue", "BullMQ 잡 큐"]
tags: [service-foundry, reference, backend, queue]
---

# @repo/backend-queue — BullMQ 기반 잡 큐 포트 + 어댑터

> 💡 **한 줄 요약**: `Producer`/`Consumer` 포트 인터페이스와 BullMQ Redis 기반 어댑터를 제공하는 framework-agnostic 잡 큐 패키지.
> **위치**: `packages/backend/queue` · **상위**: [[architecture]]

## 책임 (Responsibility)

잡 발행(`Producer`)과 소비(`Consumer`) 포트를 정의하고, BullMQ 기반 구현(`createBullProducer`, `startBullConsumer`)을 제공한다. `resolveQueueConfig`로 환경 변수에서 큐 설정을 정규화한다. 포트 추상화로 향후 다른 큐 백엔드로 교체 가능하다.

## 공개 API / export

| export | 종류 | 설명 |
|---|---|---|
| `createBullProducer` | fn | BullMQ 기반 Producer 팩토리 |
| `startBullConsumer` | fn | BullMQ 기반 Consumer 시작 팩토리 |
| `resolveQueueConfig` | fn | 큐 설정 정규화 |
| `QueueConfig` | type | 큐 설정 타입 |
| `QueueConnection` | type | Redis 연결 설정 타입 |
| `Producer` | type | 잡 발행 포트 인터페이스 |
| `Consumer` | type | 잡 소비 포트 인터페이스 |
| `JobHandler` | type | 잡 핸들러 함수 타입 |

## 의존

- 내부: 없음
- 외부: `bullmq` (Redis 기반 고성능 Node.js 잡 큐)

## 사용 예

```ts
import { createBullProducer, startBullConsumer, resolveQueueConfig } from "@repo/backend-queue";

const config = resolveQueueConfig(process.env);
const producer = createBullProducer("emails", config.connection);
await producer.enqueue("welcome", { userId: "u1" });

const consumer = startBullConsumer(
  "emails",
  { welcome: async (data) => { await sendEmail(data); } },
  config.connection,
);
```

## 연결된 개념

- [[explainers/backend/queue-worker-bullmq]] — BullMQ 워커 초기화 및 재시도 설정
- [[backend-lifecycle]] — 워커 graceful shutdown 훅 등록
- [[backend-outbox]] — 아웃박스 릴레이와 큐 조합 패턴

> 소스: spec-12-02 · `packages/backend/queue/src/`
