# @repo/backend-outbox

> 이벤트를 비즈니스 상태와 동일 트랜잭션으로 적재하고, 릴레이 폴링으로 at-least-once 발행을 보장하는 아웃박스 패턴 구현.

## 설치 / import
```ts
import { createMemoryOutboxStore, createOutboxRelay } from "@repo/backend-outbox";
```

## 핵심 API
- `createMemoryOutboxStore()` — 테스트·개발용 인메모리 `OutboxStore` 팩토리
- `createOutboxRelay({ store, publish, batchSize })` — 미발행 이벤트를 폴링·발행·마킹하는 릴레이 팩토리
- `relay.runOnce()` — 한 배치 폴링·발행 실행, 발행 실패 시 마킹 건너뜀(재시도 가능)

## 자세히
- 레퍼런스: [`docs/reference/packages/backend-outbox.md`](../../../docs/reference/packages/backend-outbox.md)
- 동작 원리: [`docs/explainers/backend/transactional-outbox.md`](../../../docs/explainers/backend/transactional-outbox.md)
