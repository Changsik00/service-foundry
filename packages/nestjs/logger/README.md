# @repo/nestjs-logger

> Pino 로거를 NestJS `LoggerService` 인터페이스로 감싸고, `reqId` 컨텍스트 자동 전파.

## 설치 / import
```ts
import { BackendLoggerModule, PinoLoggerService, BACKEND_LOGGER } from "@repo/nestjs-logger";
```

## 핵심 API
- `BackendLoggerModule.forRoot(options)` — Pino 로거 전역 DI 등록 DynamicModule 팩토리
- `PinoLoggerService` — NestJS `LoggerService` 구현체 (`log/error/warn/debug/verbose/fatal`)
- `BACKEND_LOGGER` — raw Pino logger DI token

## 자세히
- 레퍼런스: [`docs/reference/packages/nestjs-logger.md`](../../../docs/reference/packages/nestjs-logger.md)
- 동작 원리: [`docs/explainers/platform/nestjs-adapter-module-pattern.md`](../../../docs/explainers/platform/nestjs-adapter-module-pattern.md)
