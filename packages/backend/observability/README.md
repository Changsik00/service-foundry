# @repo/backend-observability

> OpenTelemetry SDK 초기화(자동 계측 포함)와 Prometheus 인증 메트릭 카운터를 제공하는 framework-agnostic observability 패키지.

## 설치 / import
```ts
import { startTracing, createAuthMetrics } from "@repo/backend-observability";
```

## 핵심 API
- `startTracing({ serviceName, otlpEndpoint })` — 앱 진입점 최상단에서 OTEL SDK 초기화
- `createTracingSdk(config)` — 커스텀 OTEL NodeSDK 팩토리
- `createAuthMetrics()` — 로그인 성공/실패 등 인증 이벤트 Prometheus 카운터 팩토리

## 자세히
- 레퍼런스: [`docs/reference/packages/backend-observability.md`](../../../docs/reference/packages/backend-observability.md)
- 동작 원리: [`docs/explainers/backend/otel-tracing-init-order.md`](../../../docs/explainers/backend/otel-tracing-init-order.md)
