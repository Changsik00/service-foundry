---
type: reference
aliases: ["@repo/backend-logger", "구조화 로거 request-id"]
tags: [service-foundry, reference, backend, logger]
---

# @repo/backend-logger — pino 기반 구조화 로거 + request-id AsyncLocalStorage

> 💡 **한 줄 요약**: pino 래퍼로 구조화 로깅과 민감 정보 자동 레댁션, AsyncLocalStorage 기반 request-id 전파를 제공하는 패키지.
> **위치**: `packages/backend/logger` · **상위**: [[architecture]]

## 책임 (Responsibility)

`createLogger`로 pino 인스턴스를 생성하고 기본 레댁션 경로(`password`, `token`, `authorization` 등)를 자동 적용한다. `AsyncLocalStorage`로 request-id를 저장하여 `getCurrentRequestId`로 어디서든 조회 가능하게 한다. `requestIdMiddleware`는 Express/NestJS 미들웨어로 사용할 수 있다.

## 공개 API / export

| export | 종류 | 설명 |
|---|---|---|
| `createLogger` | fn | pino 로거 인스턴스 팩토리 |
| `Logger` | type | pino Logger 타입 re-export |
| `LogLevel` | type | 로그 레벨 유니언 타입 |
| `CreateLoggerOptions` | type | 로거 생성 옵션 타입 |
| `DEFAULT_REDACT_PATHS` | const | 기본 레댁션 경로 배열 |
| `runWithRequestId` | fn | AsyncLocalStorage request-id 컨텍스트 실행 |
| `getCurrentRequestId` | fn | 현재 요청 컨텍스트에서 request-id 조회 |
| `generateRequestId` | fn | UUID v4 request-id 생성 |
| `requestIdMiddleware` | fn | request-id 주입 미들웨어 팩토리 |
| `RequestIdMiddlewareOptions` | type | 미들웨어 옵션 타입 |

## 의존

- 내부: 없음
- 외부: `pino` (고성능 구조화 JSON 로거), `pino-pretty` (devDependency, 개발 환경 출력)

## 사용 예

```ts
import { createLogger, requestIdMiddleware } from "@repo/backend-logger";

const logger = createLogger({ level: "info" });
logger.info({ userId: "u1" }, "user logged in");

// Express 미들웨어:
app.use(requestIdMiddleware({ header: "X-Request-Id" }));
// 이후 핸들러에서:
const reqId = getCurrentRequestId();
```

## 연결된 개념

- [[explainers/backend/request-id-propagation]] — AsyncLocalStorage request-id 전파 메커니즘
- [[adr/0005-backend-framework-and-orm-strategy]] — pino 로거 선택 근거
- [[backend-http-client]] — getCurrentRequestId 소비 패키지
- [[backend-database]] — 쿼리 로깅 연동

> 소스: spec-03-02 · `packages/backend/logger/src/`
