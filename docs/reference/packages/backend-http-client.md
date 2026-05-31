---
type: reference
aliases: ["@repo/backend-http-client", "HTTP 클라이언트 재시도"]
tags: [service-foundry, reference, backend, http-client]
---

# @repo/backend-http-client — 재시도·타임아웃·request-id 전파 HTTP 클라이언트

> 💡 **한 줄 요약**: `undici` 기반 타입 안전 HTTP 클라이언트로, 지수 백오프 재시도, 타임아웃, request-id 자동 주입, Zod 응답 검증을 제공한다.
> **위치**: `packages/backend/http-client` · **상위**: [[architecture]]

## 책임 (Responsibility)

외부 서비스 호출을 위한 HTTP 클라이언트를 제공한다. GET/PUT/DELETE/HEAD는 기본 재시도, POST/PATCH는 명시적 `retries` 지정 시에만 재시도(idempotency 안전성 보장)한다. `@repo/backend-logger`의 `getCurrentRequestId`로 `X-Request-Id` 헤더를 자동 전파한다. 선택적 `schema`로 Zod 응답 검증도 지원한다.

## 공개 API / export

| export | 종류 | 설명 |
|---|---|---|
| `createHttpClient` | fn | HTTP 클라이언트 팩토리 |
| `HttpClient` | type | 클라이언트 포트 인터페이스 |
| `CreateHttpClientOptions` | type | 클라이언트 생성 옵션 타입 |
| `HttpRequestOptions` | type | 요청 옵션 타입 (schema 포함) |
| `HttpMethod` | type | HTTP 메서드 유니언 타입 |

## 의존

- 내부: [[backend-logger]] (`@repo/backend-logger`, request-id 추출), [[shared-errors]] (`@repo/errors`)
- 외부: `undici` (Node.js 고성능 HTTP/1.1 클라이언트), `zod` (응답 스키마 검증)

## 사용 예

```ts
import { createHttpClient } from "@repo/backend-http-client";
import { z } from "zod";

const client = createHttpClient({ baseUrl: "https://api.example.com", timeoutMs: 5000 });
const data = await client.get("/users/1", {
  schema: z.object({ id: z.string(), name: z.string() }),
});
```

## 연결된 개념

- [[explainers/backend/request-id-propagation]] — request-id AsyncLocalStorage 전파 흐름
- [[backend-logger]] — `getCurrentRequestId` 제공 패키지
- [[adr/0005-backend-framework-and-orm-strategy]] — 외부 HTTP 클라이언트 스택 결정

> 소스: spec-03-04 · `packages/backend/http-client/src/`
