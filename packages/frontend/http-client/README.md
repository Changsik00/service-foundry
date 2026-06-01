# @repo/frontend-http-client

> `createHttpClient()` 팩토리로 retry/timeout/AppError 변환이 내장된 `HttpClient` 인스턴스 생성 — Next.js/Vite/Edge 공통.

## 설치 / import
```ts
import { createHttpClient, createApiClient } from "@repo/frontend-http-client";
```

## 핵심 API
- `createHttpClient(options)` — `HttpClient` 팩토리 (`baseUrl, timeoutMs, retries, headers, credentials`)
- `HttpClient` — `request/get/post/put/delete/patch<T>()` 메서드 인터페이스
- `createApiClient(http, endpoints)` — 엔드포인트 맵 → 타입 안전 API 클라이언트 생성 (코드젠 불필요)
- `EndpointDef<Out>` — `{ method, path, response: ZodType<Out> }` 엔드포인트 정의 인터페이스
- `HttpRequestOptions<T>` — `method, path, body, schema, retries, timeoutMs, headers`

## 자세히
- 레퍼런스: [`docs/reference/packages/frontend-http-client.md`](../../../docs/reference/packages/frontend-http-client.md)
- 동작 원리: [`docs/explainers/frontend/frontend-http-client-ky-wrapper.md`](../../../docs/explainers/frontend/frontend-http-client-ky-wrapper.md)
