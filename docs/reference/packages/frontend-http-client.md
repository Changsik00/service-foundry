---
type: reference
aliases: ["@repo/frontend-http-client", "프론트엔드 HTTP 클라이언트"]
tags: [service-foundry, reference, frontend]
---

# @repo/frontend-http-client — ky 기반 타입 안전 HTTP 클라이언트

> 💡 **한 줄 요약**: `createHttpClient()` 팩토리로 retry/timeout/AppError 변환이 내장된 `HttpClient` 인스턴스 생성 — Next.js/Vite/Edge 공통.
> **위치**: `packages/frontend/http-client` · **상위**: [[architecture]]

## 책임 (Responsibility)

`ky` 위에 `HttpClient` 인터페이스를 구현해 모든 fetch 에러를 `AppError`로 통일 변환한다. `schema?: ZodType<T>` 옵션으로 응답을 런타임 검증하며, `createApiClient(http, endpoints)` 로 엔드포인트 맵에서 타입·검증 완비 클라이언트를 코드젠 없이 생성한다. `globalThis.fetch` 기반이라 Edge runtime에서도 동작한다.

## 공개 API / export

| export | 종류 | 설명 |
|---|---|---|
| `createHttpClient(options)` | fn | `HttpClient` 팩토리 |
| `HttpClient` | interface | `request/get/post/put/delete/patch<T>()` 메서드 |
| `CreateHttpClientOptions` | interface | `baseUrl, timeoutMs, retries, headers, credentials` |
| `HttpRequestOptions<T>` | interface | `method, path, body, schema, retries, timeoutMs, headers` |
| `HttpMethod` | type | `"GET" \| "POST" \| "PUT" \| "DELETE" \| "PATCH" \| "HEAD"` |
| `createApiClient<E>(http, endpoints)` | fn | 엔드포인트 맵 → 타입 안전 API 클라이언트 |
| `EndpointDef<Out>` | interface | `{ method, path, response: ZodType<Out> }` |
| `ApiCallOptions` | interface | `body?, headers?, path?` |
| `ApiClient<E>` | type | 엔드포인트 맵에서 파생된 클라이언트 타입 |

## 의존

- 내부: [[shared-errors]] (`AppError`)
- 외부: `ky` (HTTP 클라이언트), `zod` (peer — 응답 검증)

## 사용 예

```ts
import { createHttpClient, createApiClient } from "@repo/frontend-http-client";
import { UserProfile } from "@repo/contracts/user";

const http = createHttpClient({ baseUrl: "/api", retries: 2 });
const api = createApiClient(http, {
  getUser: { method: "GET", path: "users/me", response: UserProfile },
});
const user = await api.getUser(); // 타입: UserProfile
```

## 연결된 개념

- [[explainers/frontend/frontend-http-client-ky-wrapper]] — 내부 동작 원리
- [[shared-errors]] — `AppError` 에러 변환 (NETWORK/TIMEOUT/UPSTREAM/BAD_REQUEST/VALIDATION)
- [[shared-contracts]] — `ZodType` 응답 스키마 공급
- [[nestjs-http-client]] — BE 측 동등 패키지

> 소스: spec-04-02 · `packages/frontend/http-client/src/index.ts`
