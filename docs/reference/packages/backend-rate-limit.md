---
type: reference
aliases: ["@repo/backend-rate-limit", "범용 레이트 리밋"]
tags: [service-foundry, reference, backend, rate-limit]
---

# @repo/backend-rate-limit — 범용 슬라이딩 윈도우 레이트 리밋 포트

> 💡 **한 줄 요약**: 임의 키(웹훅·외부 호출·워커)에 대한 슬라이딩 윈도우 레이트 리밋 포트와 인메모리 어댑터를 제공하는 framework-agnostic 패키지.
> **위치**: `packages/backend/rate-limit` · **상위**: [[architecture]]

## 책임 (Responsibility)

로그인 전용 `@repo/backend-auth-rate-limit`과 별개로, 범용 키 기반 throttling을 제공한다. `RateLimiter` 포트를 정의하고 인메모리 슬라이딩 윈도우 구현(`createMemoryRateLimiter`)을 포함한다. Redis 어댑터는 후속 제공 예정이다.

## 공개 API / export

| export | 종류 | 설명 |
|---|---|---|
| `createMemoryRateLimiter` | fn | 인메모리 슬라이딩 윈도우 레이트 리밋 팩토리 |
| `RateLimiter` | type | `consume(key, cost?)` 포트 인터페이스 |
| `RateLimitResult` | type | 소비 결과 타입 (allowed, remaining, retryAfterMs) |
| `MemoryRateLimiterOptions` | type | 인메모리 옵션 타입 (limit, windowMs, now) |

## 의존

- 내부: 없음
- 외부: 없음

## 사용 예

```ts
import { createMemoryRateLimiter } from "@repo/backend-rate-limit";

const limiter = createMemoryRateLimiter({ limit: 100, windowMs: 60_000 });
const result = await limiter.consume("webhook:provider-a");
if (!result.allowed) {
  throw new Error(`Rate limited, retry after ${result.retryAfterMs}ms`);
}
```

## 연결된 개념

- [[explainers/backend/secrets-provider-port]] — secrets·rate-limit 포트-어댑터 패턴 공통 설계
- [[backend-auth-rate-limit]] — 로그인 전용 레이트 리밋 (IP+계정 슬라이딩 윈도우 + 잠금)
- [[backend-cache]] — Redis 어댑터 구현 시 의존 예정

> 소스: spec-14-05 · `packages/backend/rate-limit/src/`
