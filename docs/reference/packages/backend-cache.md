---
type: reference
aliases: ["@repo/backend-cache", "캐시 포트 Redis 어댑터"]
tags: [service-foundry, reference, backend, cache]
---

# @repo/backend-cache — 캐시 포트 + in-memory/Redis 어댑터

> 💡 **한 줄 요약**: `Cache` 포트 인터페이스와 in-memory 및 `ioredis` 기반 Redis 어댑터를 제공하는 framework-agnostic 캐시 추상화 패키지.
> **위치**: `packages/backend/cache` · **상위**: [[architecture]]

## 책임 (Responsibility)

`Cache` 포트 인터페이스를 정의하여 캐시 구현체를 교환 가능하게 한다. 개발·테스트용 인메모리 어댑터(`createMemoryCache`)와 프로덕션용 Redis 어댑터(`createRedisCache`)를 제공한다. `@repo/backend-idempotency` 등 상위 패키지가 이 포트에 의존하여 저장소 독립성을 유지한다.

## 공개 API / export

| export | 종류 | 설명 |
|---|---|---|
| `Cache` | type | 캐시 포트 인터페이스 (get/set/del/getOrSet) |
| `createMemoryCache` | fn | 인메모리 캐시 어댑터 팩토리 |
| `createRedisCache` | fn | ioredis 기반 Redis 캐시 어댑터 팩토리 |
| `RedisCache` | type | Redis 어댑터 인터페이스 |
| `RedisCacheConnection` | type | Redis 연결 옵션 타입 |

## 의존

- 내부: 없음
- 외부: `ioredis` (Redis 클라이언트)

## 사용 예

```ts
import { createRedisCache } from "@repo/backend-cache";

const cache = createRedisCache({ host: "localhost", port: 6379 });
await cache.set("key", { data: 42 }, 300); // TTL 300초
const val = await cache.get<{ data: number }>("key");
await cache.del("key");
```

## 연결된 개념

- [[explainers/backend/cache-aside-port]] — Cache-aside 패턴 및 포트-어댑터 교체 전략
- [[backend-idempotency]] — Cache 포트를 소비하는 멱등 실행 헬퍼
- [[backend-rate-limit]] — 범용 레이트 리밋 (redis 어댑터 후속)

> 소스: spec-12-03 · `packages/backend/cache/src/`
