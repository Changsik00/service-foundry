---
type: reference
aliases: ["@repo/nestjs-http-client", "NestJS HTTP 클라이언트 모듈"]
tags: [service-foundry, reference, nestjs]
---

# @repo/nestjs-http-client — `backend-http-client` NestJS DI 어댑터

> 💡 **한 줄 요약**: `HttpClientModule.forRoot(options)` 로 typed HTTP 클라이언트를 NestJS DI 컨테이너에 전역 등록.
> **위치**: `packages/nestjs/http-client` · **상위**: [[architecture]]

## 책임 (Responsibility)

`@repo/backend-http-client`의 `createHttpClient()` 팩토리 결과를 `HTTP_CLIENT` symbol provider로 NestJS 전역 주입한다. ADR-0016 표준 `@Module` class 패턴을 따른다. `HttpClient` 타입과 `CreateHttpClientOptions`를 re-export해 호출자가 이 패키지만 import하면 된다.

## 공개 API / export

| export | 종류 | 설명 |
|---|---|---|
| `HTTP_CLIENT` | symbol | DI injection token |
| `HttpClientModule` | class (`@Module`) | `forRoot(options)` static DynamicModule 팩토리 |
| `HttpClient` | type (re-export) | HTTP 클라이언트 인터페이스 |
| `CreateHttpClientOptions` | type (re-export) | 클라이언트 생성 옵션 |

## 의존

- 내부: `@repo/backend-http-client`
- 외부: `@nestjs/common`, `reflect-metadata`

## 사용 예

```ts
import { HttpClientModule, HTTP_CLIENT, type HttpClient } from "@repo/nestjs-http-client";

@Module({ imports: [HttpClientModule.forRoot({ baseUrl: "https://api.example.com" })] })
export class AppModule {}

@Injectable()
class PaymentService {
  constructor(@Inject(HTTP_CLIENT) private http: HttpClient) {}
  async charge(amount: number) {
    return this.http.post("/charge", { amount });
  }
}
```

## 연결된 개념

- [[adr/0015-framework-adapter-naming-and-layout]] — 어댑터 네이밍 규약
- [[adr/0016-nestjs-adapter-standard-module-pattern]] — 표준 Module 패턴
- [[explainers/platform/nestjs-adapter-module-pattern]] — 동작 원리
- [[frontend-http-client]] — FE 측 동등 패키지

> 소스: spec-03-04 · `packages/nestjs/http-client/src/index.ts`
