---
type: reference
aliases: ["@repo/backend-idempotency", "멱등 실행 헬퍼"]
tags: [service-foundry, reference, backend, idempotency]
---

# @repo/backend-idempotency — Idempotency-Key 기반 멱등 실행 헬퍼

> 💡 **한 줄 요약**: Idempotency-Key 별 첫 실행 결과를 `Cache` 포트에 저장하고, 재요청 시 핸들러 없이 결과를 재생하는 단일 함수 패키지.
> **위치**: `packages/backend/idempotency` · **상위**: [[architecture]]

## 책임 (Responsibility)

`withIdempotency`는 키 기반으로 캐시를 조회하고, 미캐시 시 `fn`을 실행해 결과를 저장한다. `fn` 예외 시 저장하지 않으므로 실패한 요청은 재시도 가능하다. 저장소는 `Cache` 포트(`@repo/backend-cache`)로 추상화되어 Redis 또는 인메모리 어댑터를 사용할 수 있다.

## 공개 API / export

| export | 종류 | 설명 |
|---|---|---|
| `withIdempotency` | fn | 멱등 실행 래퍼 (cache, key, ttlSeconds, fn) |

## 의존

- 내부: [[backend-cache]] (`@repo/backend-cache`, Cache 포트)
- 외부: 없음

## 사용 예

```ts
import { withIdempotency } from "@repo/backend-idempotency";
import { createRedisCache } from "@repo/backend-cache";

const cache = createRedisCache({ host: "localhost", port: 6379 });
const result = await withIdempotency(cache, `payment:${requestId}`, 86400, async () => {
  return processPayment(payload);
});
```

## 연결된 개념

- [[explainers/backend/idempotency-key-replay]] — 키 저장·재생 동작 및 실패 처리 전략
- [[backend-cache]] — 저장소로 사용되는 Cache 포트
- [[backend-outbox]] — at-least-once 발행과의 조합 패턴

> 소스: spec-13-02 · `packages/backend/idempotency/src/`
