# phase-11: Observability + App Generator

> phase-10(Ops & Tooling)에서 이월된 운영성 마무리 — 분산추적 + 메트릭 + 대시보드/alert + 앱 생성기.
> 본 phase 의 모든 SPEC 을 요점/방향성으로 나열. 구체 작업은 `specs/spec-11-{seq}-{slug}/spec.md`.

## 📋 메타

| 항목 | 값 |
|---|---|
| **Phase ID** | `phase-11` |
| **상태** | In Progress |
| **시작일** | 2026-05-30 |
| **목표 종료일** | 미정 |
| **소유자** | dennis |
| **Base Branch** | `phase-11-observability` |

## 🎯 배경 및 목표

### 현재 상황

phase-10 에서 docker 인프라(prometheus/grafana/tempo/loki **stub**) + package 생성기 + tooling 스크립트(manifest/startup-report/config-graph)를 갖췄다. 그러나 (1) 관측 스택은 "기동만" 할 뿐 실제 trace/metric/dashboard/alert 파이프라인이 비어 있고(spec-10-01 stub), (2) `pnpm new app` 앱 생성기는 미구현(spec-10-02 는 package 만)이다.

### 목표 (Goal)

apps/api 가 trace(OTEL→tempo) + metric(prometheus) 을 실제 방출하고, grafana 대시보드/alert 로 auth 보안 이벤트를 관측 가능하게 한다. 그리고 `pnpm new app` 으로 api/next/vite 앱을 ADR-0003 레이아웃대로 스캐폴딩한다.

### 성공 기준 (Success Criteria) — 정량 우선

1. `pnpm new app <name>` 실행 시 api/next/vite 타입별로 ADR-0003 layout + `@apps/*` 네이밍에 맞춰 스캐폴딩되고, 생성 앱이 typecheck/lint 0 error.
2. apps/api 가 OTEL trace 를 tempo 로 export (compose tempo 에서 trace 조회 가능).
3. apps/api `/metrics` 엔드포인트가 auth 카운터(login.attempts/.success/.failure, token.refreshed 등) 노출 + prometheus 가 scrape.
4. grafana 에 prometheus datasource provisioning + auth 대시보드 패널 표시.
5. alert rule: brute force(동일 IP N회 실패) + refresh reuse 감지 (geo/impossible-travel 은 메트릭만, alert 는 후속 — §위험).

## 🧩 작업 단위 (SPECs)

<!-- sdd:specs:start -->
| ID | 슬러그 | 우선순위 | 상태 | 디렉토리 |
|---|---|:---:|---|---|
| `spec-11-01` | app-generator | P? | Merged | `specs/spec-11-01-app-generator/` |
| `spec-11-02` | otel-tracing | P? | Merged | `specs/spec-11-02-otel-tracing/` |
| `spec-11-03` | metrics-endpoint | P? | Merged | `specs/spec-11-03-metrics-endpoint/` |
<!-- sdd:specs:end -->

### spec-11-01 — app-generator

- **요점**: `pnpm new app` (turbo gen `app`) — api(NestJS)/next/vite 템플릿.
- **방향성**: phase-10 의 `turbo/generators` package 생성기 연장. `resolveAppTarget` 순수 함수(타입별 dir/name/scripts) + handlebars/inline 템플릿 + 생성→install→typecheck/lint 스모크.
- **참조**: spec-10-02 (package generator), ADR-0003.
- **연관 모듈**: `turbo/generators/`

### spec-11-02 — otel-tracing

- **요점**: apps/api 에 OpenTelemetry SDK 배선 → compose tempo 로 trace export.
- **방향성**: `@repo/backend-observability`(또는 nestjs 어댑터) 신설 — OTEL NodeSDK + OTLP exporter. 부트 시 init, HTTP/DB 자동 계측.
- **연관 모듈**: `packages/backend/observability/` (신설) + `apps/api` + `tooling/docker` prometheus/tempo

### spec-11-03 — metrics-endpoint

- **요점**: apps/api `/metrics`(prom-client) + auth 이벤트 카운터 + prometheus scrape target 실배선.
- **방향성**: backend-observability 에 metric registry. auth 이벤트(`@repo/backend-auth-audit` 연동)에서 카운터 증가. spec-10-01 prometheus.yml 에 apps/api scrape 추가.
- **연관 모듈**: `packages/backend/observability/` + `apps/api` + `tooling/docker/observability/prometheus.yml`

### spec-11-04 — grafana-dashboards-alerts

- **요점**: grafana datasource/dashboard provisioning + alert rule.
- **방향성**: `tooling/docker/observability/grafana/` provisioning(datasource=prometheus + auth dashboard JSON) + alert(brute force / refresh reuse). geo alert 는 후속.
- **연관 모듈**: `tooling/docker/observability/grafana/` + prometheus alert rules

## 📌 결정 기록 (Review)

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| observability 패키지 위치 | apps/api 직접 / `@repo/backend-observability` | backend-observability (재사용) | 다른 앱도 동일 계측 — core 순수 + nestjs 어댑터 |
| impossible-travel alert | 구현 / 메트릭만+후속 | 메트릭만, alert 후속 | IP geo 의존 로컬 검증 난해 (§위험) |

## 🧪 통합 테스트 시나리오 (간결)

### 시나리오 1: app generator round-trip
- **Given**: spec-11-01 머지됨.
- **When**: `pnpm new app demo-api`(api) → 생성 디렉토리에서 typecheck/lint.
- **Then**: 0 error.
- **연관 SPEC**: spec-11-01

### 시나리오 2: auth observability (trace + metric + alert)
- **Given**: spec-11-02~04 머지 + docker 스택 기동.
- **When**: brute force 시뮬(동일 IP N회 login 실패).
- **Then**: prometheus 에 `auth.login.failure` 증가 + grafana alert 발생 + tempo 에 trace 존재.
- **연관 SPEC**: spec-11-02, 03, 04

## 🔗 의존성

- **선행 phase**: phase-10 (docker stack stub, generator 기반).
- **외부 시스템**: Docker (prometheus/grafana/tempo).
- **연관 ADR**: ADR-0003 (layout), ADR-0015 (어댑터).

## 📝 위험 요소 및 완화

| 위험 | 영향 | 완화책 |
|---|---|---|
| impossible-travel geo 검증 난해 | alert 시나리오 미완 | 메트릭만 노출, geo alert 는 후속 spec/phase |
| grafana provisioning 시 secret 가드 오탐 | 커밋 차단 | `[[feedback_secrets_guard_compose_env]]` — warn 우회 |
| OTEL 의존 추가 비용 | 번들/부트 영향 | backend-observability 로 격리, 옵트인 init |

## 🏁 Phase Done 조건

- [ ] 모든 SPEC 이 `phase-11-observability` → main merge
- [ ] 통합 테스트 시나리오 1·2 PASS
- [ ] 성공 기준 1~5 측정 결과 기록
- [ ] 사용자 최종 승인

## 📊 검증 결과 (phase 완료 시 작성)

<!-- 통합 테스트 로그, 성공 기준 측정값 -->
