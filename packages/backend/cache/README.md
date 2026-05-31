# @repo/backend-cache

> `Cache` 포트 인터페이스와 in-memory 및 `ioredis` 기반 Redis 어댑터를 제공하는 framework-agnostic 캐시 추상화 패키지.

## 설치 / import
```ts
import { createRedisCache, createMemoryCache } from "@repo/backend-cache";
```

## 핵심 API
- `createRedisCache(connection)` — ioredis 기반 Redis 캐시 어댑터 팩토리
- `createMemoryCache()` — 개발·테스트용 인메모리 캐시 어댑터 팩토리
- `Cache` — `get / set(key, value, ttlSeconds) / del` 포트 인터페이스

## 자세히
- 레퍼런스: [`docs/reference/packages/backend-cache.md`](../../../docs/reference/packages/backend-cache.md)
- 동작 원리: [`docs/explainers/backend/cache-aside-port.md`](../../../docs/explainers/backend/cache-aside-port.md)
