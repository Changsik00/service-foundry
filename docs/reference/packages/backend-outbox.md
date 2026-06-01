---
type: reference
aliases: ["@repo/backend-outbox", "트랜잭셔널 아웃박스"]
tags: [service-foundry, reference, backend, outbox]
---

# @repo/backend-outbox — Transactional Outbox 포트 + 인메모리 어댑터 + 릴레이

> 💡 **한 줄 요약**: 이벤트를 비즈니스 상태와 동일 트랜잭션으로 적재하고, 릴레이 폴링으로 at-least-once 발행을 보장하는 아웃박스 패턴 구현.
> **위치**: `packages/backend/outbox` · **상위**: [[architecture]]

## 책임 (Responsibility)

`OutboxStore` 포트와 인메모리 구현(`createMemoryOutboxStore`), 그리고 미발행 이벤트를 폴링·발행·마킹하는 `OutboxRelay`(`createOutboxRelay`)를 제공한다. 발행 실패 시 해당 배치는 마킹되지 않아 다음 `runOnce` 호출 시 재시도된다. Drizzle 기반 실 저장소는 후속 패키지로 제공된다.

## 공개 API / export

| export | 종류 | 설명 |
|---|---|---|
| `createMemoryOutboxStore` | fn | 인메모리 OutboxStore 팩토리 |
| `createOutboxRelay` | fn | OutboxRelay 팩토리 |
| `OutboxStore` | type | 적재·조회·마킹 포트 인터페이스 |
| `OutboxRelay` | type | 릴레이 포트 인터페이스 |
| `OutboxEvent` | type | 저장된 이벤트 타입 |
| `NewOutboxEvent` | type | 적재 입력 타입 (id 없음) |
| `MemoryOutboxStoreOptions` | type | 인메모리 저장소 옵션 타입 |
| `OutboxRelayOptions` | type | 릴레이 옵션 타입 |

## 의존

- 내부: 없음
- 외부: 없음

## 사용 예

```ts
import { createMemoryOutboxStore, createOutboxRelay } from "@repo/backend-outbox";

const store = createMemoryOutboxStore();
// 트랜잭션 내에서 이벤트 적재:
await store.add({ type: "user.registered", payload: { userId: "u1" } });

const relay = createOutboxRelay({
  store,
  publish: async (event) => { await messageBus.send(event); },
  batchSize: 50,
});
// 주기적 폴링:
const published = await relay.runOnce();
```

## 연결된 개념

- [[explainers/backend/transactional-outbox]] — dual-write 문제 및 at-least-once 보장 메커니즘
- [[backend-queue]] — 큐 워커와 아웃박스 릴레이 조합
- [[backend-idempotency]] — 소비자 측 중복 방지 패턴

> 소스: spec-13-04 · `packages/backend/outbox/src/`
