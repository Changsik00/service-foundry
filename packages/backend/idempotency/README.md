# @repo/backend-idempotency

> Idempotency-Key 별 첫 실행 결과를 `Cache` 포트에 저장하고, 재요청 시 핸들러 없이 결과를 재생하는 단일 함수 패키지.

## 설치 / import
```ts
import { withIdempotency } from "@repo/backend-idempotency";
```

## 핵심 API
- `withIdempotency(cache, key, ttlSeconds, fn)` — 키 기반 멱등 실행 래퍼; 캐시 히트 시 `fn` 실행 없이 결과 반환, `fn` 예외 시 저장하지 않아 재시도 가능

## 자세히
- 레퍼런스: [`docs/reference/packages/backend-idempotency.md`](../../../docs/reference/packages/backend-idempotency.md)
- 동작 원리: [`docs/explainers/backend/idempotency-key-replay.md`](../../../docs/explainers/backend/idempotency-key-replay.md)
