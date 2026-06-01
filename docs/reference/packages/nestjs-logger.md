---
type: reference
aliases: ["@repo/nestjs-logger", "NestJS 로거 모듈"]
tags: [service-foundry, reference, nestjs, otel]
---

# @repo/nestjs-logger — `backend-logger` NestJS DI 어댑터

> 💡 **한 줄 요약**: Pino 로거를 NestJS `LoggerService` 인터페이스로 감싸고, `reqId` 컨텍스트 자동 전파.
> **위치**: `packages/nestjs/logger` · **상위**: [[architecture]]

## 책임 (Responsibility)

`@repo/backend-logger`의 Pino 인스턴스를 NestJS의 `LoggerService` 계약을 구현하는 `PinoLoggerService`로 래핑한다. `getCurrentRequestId()`를 통해 AsyncLocalStorage에서 요청 ID를 읽어 모든 로그에 자동으로 포함한다. `BackendLoggerModule.forRoot(options)` 로 전역 등록한다.

## 공개 API / export

| export | 종류 | 설명 |
|---|---|---|
| `PinoLoggerService` | class | NestJS `LoggerService` 구현체 (log/error/warn/debug/verbose/fatal) |
| `BACKEND_LOGGER` | symbol | raw Pino logger DI token |
| `BackendLoggerModule` | class (`@Module`) | `forRoot(options)` static DynamicModule 팩토리 |

## 의존

- 내부: `@repo/backend-logger` (pino 인스턴스, `createLogger`, `getCurrentRequestId`)
- 외부: `@nestjs/common`, `pino`, `reflect-metadata`

## 사용 예

```ts
import { BackendLoggerModule, PinoLoggerService } from "@repo/nestjs-logger";

// main.ts
const app = await NestFactory.create(AppModule, { bufferLogs: true });
app.useLogger(app.get(PinoLoggerService));

// AppModule
@Module({ imports: [BackendLoggerModule.forRoot({ level: "info" })] })
export class AppModule {}
```

## 연결된 개념

- [[adr/0015-framework-adapter-naming-and-layout]] — 어댑터 네이밍 규약
- [[adr/0016-nestjs-adapter-standard-module-pattern]] — 표준 Module 패턴
- [[explainers/platform/nestjs-adapter-module-pattern]] — 동작 원리

> 소스: spec-03-02 · `packages/nestjs/logger/src/index.ts`
