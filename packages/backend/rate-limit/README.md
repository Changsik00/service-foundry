# @repo/backend-rate-limit

> 임의 키(웹훅·외부 호출·워커)에 대한 슬라이딩 윈도우 레이트 리밋 포트와 인메모리 어댑터를 제공하는 framework-agnostic 패키지.

## 설치 / import
```ts
import { createMemoryRateLimiter } from "@repo/backend-rate-limit";
```

## 핵심 API
- `createMemoryRateLimiter({ limit, windowMs })` — 인메모리 슬라이딩 윈도우 레이트 리밋 팩토리
- `limiter.consume(key, cost?)` — 토큰 소비, `{ allowed, remaining, retryAfterMs }` 반환
- `RateLimiter` — `consume(key, cost?)` 포트 인터페이스 (Redis 어댑터 교체 지점)

## 자세히
- 레퍼런스: [`docs/reference/packages/backend-rate-limit.md`](../../../docs/reference/packages/backend-rate-limit.md)
- 동작 원리: [`docs/explainers/backend/secrets-provider-port.md`](../../../docs/explainers/backend/secrets-provider-port.md)
