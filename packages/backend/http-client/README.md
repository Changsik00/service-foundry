# @repo/backend-http-client

> `undici` 기반 타입 안전 HTTP 클라이언트로, 지수 백오프 재시도, 타임아웃, request-id 자동 주입, Zod 응답 검증을 제공한다.

## 설치 / import
```ts
import { createHttpClient } from "@repo/backend-http-client";
```

## 핵심 API
- `createHttpClient(options)` — HTTP 클라이언트 팩토리 (`baseUrl`, `timeoutMs` 등)
- `client.get(path, { schema })` — GET 요청, Zod 스키마로 응답 검증 (선택)
- `client.post(path, body, { retries })` — POST 요청, 명시적 `retries` 지정 시에만 재시도

## 자세히
- 레퍼런스: [`docs/reference/packages/backend-http-client.md`](../../../docs/reference/packages/backend-http-client.md)
- 동작 원리: [`docs/explainers/backend/request-id-propagation.md`](../../../docs/explainers/backend/request-id-propagation.md)
