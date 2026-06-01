# @repo/backend-logger

> pino 래퍼로 구조화 로깅과 민감 정보 자동 레댁션, AsyncLocalStorage 기반 request-id 전파를 제공하는 패키지.

## 설치 / import
```ts
import { createLogger, requestIdMiddleware, getCurrentRequestId } from "@repo/backend-logger";
```

## 핵심 API
- `createLogger(options)` — pino 로거 인스턴스 팩토리 (레댁션 경로 자동 적용)
- `requestIdMiddleware(options)` — `X-Request-Id` 헤더를 AsyncLocalStorage에 주입하는 미들웨어 팩토리
- `getCurrentRequestId()` — 현재 요청 컨텍스트에서 request-id 조회
- `runWithRequestId(id, fn)` — 임의 컨텍스트에서 request-id 범위 실행

## 자세히
- 레퍼런스: [`docs/reference/packages/backend-logger.md`](../../../docs/reference/packages/backend-logger.md)
- 동작 원리: [`docs/explainers/backend/request-id-propagation.md`](../../../docs/explainers/backend/request-id-propagation.md)
