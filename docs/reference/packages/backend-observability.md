---
type: reference
aliases: ["@repo/backend-observability", "OTEL 추적 프로메테우스 메트릭"]
tags: [service-foundry, reference, backend, otel, metrics]
---

# @repo/backend-observability — OpenTelemetry 추적 + Prometheus 메트릭

> 💡 **한 줄 요약**: OpenTelemetry SDK 초기화(자동 계측 포함)와 Prometheus 인증 메트릭 카운터를 제공하는 framework-agnostic observability 패키지.
> **위치**: `packages/backend/observability` · **상위**: [[architecture]]

## 책임 (Responsibility)

`startTracing`으로 앱 부트 최상단에서 OTEL SDK를 초기화하여 분산 추적을 활성화한다. `createTracingSdk`로 커스텀 SDK 인스턴스를 생성하고, `resolveTracingConfig`로 환경 변수 기반 설정을 정규화한다. `createAuthMetrics`는 로그인 성공/실패 등 인증 이벤트 카운터를 `prom-client`로 제공한다.

## 공개 API / export

| export | 종류 | 설명 |
|---|---|---|
| `startTracing` | fn | OTEL SDK 초기화 (부트 최상단 호출) |
| `createTracingSdk` | fn | 커스텀 OTEL NodeSDK 팩토리 |
| `resolveTracingConfig` | fn | 추적 설정 정규화 |
| `TracingConfig` | type | 추적 설정 타입 |
| `TracingDefaults` | type | 기본값 타입 |
| `createAuthMetrics` | fn | 인증 이벤트 Prometheus 카운터 팩토리 |
| `AuthMetrics` | type | 인증 메트릭 인터페이스 |

## 의존

- 내부: 없음
- 외부: `@opentelemetry/api`, `@opentelemetry/sdk-node`, `@opentelemetry/auto-instrumentations-node`, `@opentelemetry/exporter-trace-otlp-proto`, `@opentelemetry/resources`, `@opentelemetry/semantic-conventions`, `prom-client`

## 사용 예

```ts
import { startTracing, createAuthMetrics } from "@repo/backend-observability";

// 앱 진입점 최상단:
startTracing({ serviceName: "api", otlpEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT });

const metrics = createAuthMetrics();
metrics.loginSuccess.inc({ provider: "password" });
metrics.loginFailure.inc({ reason: "invalid_credentials" });
```

## 연결된 개념

- [[explainers/backend/otel-tracing-init-order]] — OTEL 초기화 순서 및 계측 등록
- [[explainers/backend/prom-metrics-auth-counters]] — Prometheus 인증 메트릭 설계
- [[backend-logger]] — 로그-추적 상관관계

> 소스: spec-11-02, spec-11-03 · `packages/backend/observability/src/`
