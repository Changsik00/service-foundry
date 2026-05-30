# spec-11-02: OTEL 분산추적 (apps/api → tempo)

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-11-02` |
| **Phase** | `phase-11` |
| **Branch** | `spec-11-02-otel-tracing` |
| **상태** | Planning |
| **타입** | Feature |
| **Integration Test Required** | yes |
| **작성일** | 2026-05-30 |
| **소유자** | dennis |

## 📋 배경 및 문제 정의

### 현재 상황
phase-10 에서 tempo 가 compose 에 stub 으로 기동되나(otlp receiver 설정은 tempo.yaml 에 존재), (1) trace 를 방출하는 쪽이 없고, (2) tempo 의 OTLP 수신 포트(4317/4318)가 호스트로 노출되지 않아 apps/api(호스트 실행)가 trace 를 보낼 수 없다.

### 문제점
- 분산추적 부재 → 요청 흐름/지연/에러 전파 가시성 0. "운영 가능" 의 핵심 축 결여.
- OTEL 초기화는 계측 대상 모듈보다 **먼저** 로드돼야 해 배선 순서가 까다롭다.

### 해결 방안 (요약)
**`@repo/backend-observability`** 를 신설 — OTEL NodeSDK + OTLP(proto/http) exporter + 자동계측(http/express/pg). 설정은 `resolveTracingConfig(env)` 순수 함수로 분리(테스트). apps/api 는 `src/tracing.ts` 를 `main.ts` **최상단**에서 import 해 부트 전 init(env-gated). compose 의 tempo 에 OTLP 포트(4317/4318)를 노출한다.

## 🎯 요구사항

### Functional Requirements
1. `@repo/backend-observability` 가 `resolveTracingConfig(env)` + `createTracingSdk(config)` 제공.
2. `resolveTracingConfig`: `OTEL_EXPORTER_OTLP_ENDPOINT` 유무로 enabled 판정, `serviceName`(OTEL_SERVICE_NAME 또는 인자), endpoint, sampling ratio 해석. enabled=false 면 no-op.
3. `createTracingSdk` 가 NodeSDK(OTLP exporter + auto-instrumentations + resource service.name) 구성, `start()`/`shutdown()` 제공.
4. apps/api: `OTEL_EXPORTER_OTLP_ENDPOINT` 설정 시 부트 전 tracing init (미설정 시 no-op — 기존 동작 불변).
5. compose tempo 에 OTLP 포트 `4317`(grpc) `4318`(http) 노출.
6. 패키지는 framework-agnostic (core) — NestJS 의존 없음 (ADR-0015).

### Non-Functional Requirements
1. OTEL 미설정 시 부트/런타임 영향 0 (opt-in).
2. 시크릿/PII 미포함 — resource attribute 는 service.name/version 등 비민감만.
3. 버전은 catalog (`@opentelemetry/*`).

## 🚫 Out of Scope
- 메트릭(/metrics, prometheus) → spec-11-03.
- grafana 대시보드/alert → spec-11-04.
- custom span(도메인 수동 계측) — 본 spec 은 자동계측 + init 까지.

## 📑 ADR 후보
- [x] 있음 → `backend-observability-package` (convention/decision) — observability 를 core 패키지로 두고 OTLP exporter 표준. phase 누적 후 또는 본 spec 머지 시 검토.
- [ ] 없음

## 🔗 관련 문서 (Related)
- 관련 phase: `backlog/phase-11.md` (§성공 기준 2, §시나리오 2)
- 관련 ADR: ADR-0015 (core/adapter 경계)
- 직전 spec: spec-11-01 (app-generator)

## ✅ Definition of Done
- [ ] `resolveTracingConfig` 단위 테스트 PASS
- [ ] 통합: tempo 기동 + 패키지로 test span 방출 → tempo query API 에서 trace 확인
- [ ] apps/api OTEL init (env-gated) + 미설정 시 부트 불변 확인
- [ ] walkthrough / pr_description ship
- [ ] push + PR (base `phase-11-observability`)
- [ ] 사용자 알림
