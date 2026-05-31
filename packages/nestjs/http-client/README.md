# @repo/nestjs-http-client

> `HttpClientModule.forRoot(options)`로 typed HTTP 클라이언트를 NestJS DI 컨테이너에 전역 등록.

## 설치 / import
```ts
import { HttpClientModule, HTTP_CLIENT, type HttpClient } from "@repo/nestjs-http-client";
```

## 핵심 API
- `HttpClientModule.forRoot(options)` — HTTP 클라이언트 전역 DI 등록 DynamicModule 팩토리
- `HTTP_CLIENT` — DI injection token (`@Inject(HTTP_CLIENT)`)
- `HttpClient` — HTTP 클라이언트 인터페이스 타입 (re-export)
- `CreateHttpClientOptions` — 클라이언트 생성 옵션 타입 (re-export)

## 자세히
- 레퍼런스: [`docs/reference/packages/nestjs-http-client.md`](../../../docs/reference/packages/nestjs-http-client.md)
- 동작 원리: [`docs/explainers/platform/nestjs-adapter-module-pattern.md`](../../../docs/explainers/platform/nestjs-adapter-module-pattern.md)
