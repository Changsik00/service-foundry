# spec-11-03: 메트릭 엔드포인트 + auth 카운터

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-11-03` |
| **Phase** | `phase-11` |
| **Branch** | `spec-11-03-metrics-endpoint` |
| **상태** | Planning |
| **타입** | Feature |
| **Integration Test Required** | no (단위 + compose config 로 검증, 전체 scrape→대시보드는 spec-11-04 / phase 시나리오 2) |
| **작성일** | 2026-05-30 |
| **소유자** | dennis |

## 📋 배경 및 문제 정의

### 현재 상황
11-02 로 trace 는 tempo 로 가지만, **메트릭(/metrics)을 노출하는 쪽이 없고** prometheus 가 scrape 할 대상도 없다. auth 보안 이벤트(로그인 성공/실패 등)가 수치로 집계되지 않아 brute force 등의 관측/알림(11-04)이 불가능하다.

### 문제점
- auth 이벤트 카운터 부재 → brute force/이상징후를 수치로 볼 수 없음.
- prometheus 가 apps/api 를 scrape 하도록 연결돼 있지 않음(10-01 stub 은 self-scrape 만).

### 해결 방안 (요약)
`@repo/backend-observability` 에 prom-client 기반 **`createAuthMetrics()`**(Registry + auth 카운터)를 추가. apps/api 는 `GET /metrics`(prom text) 엔드포인트 + 로그인 경로(controller)에서 attempt/success/failure 카운터 증가. prometheus.yml 에 apps/api scrape target 추가.

## 🎯 요구사항

### Functional Requirements
1. `@repo/backend-observability` `createAuthMetrics()` → `{ registry, recordLoginAttempt/Success/Failure(...), metricsText() }` (prom-client).
2. 카운터: `auth_login_attempts_total`, `auth_login_success_total`, `auth_login_failure_total` (label: 없음 또는 reason — 최소). 확장(token.refreshed 등)은 동일 패턴으로 추가 가능하게.
3. apps/api `GET /metrics` → `Content-Type: text/plain` prom format 반환.
4. apps/api 로그인 처리(controller): 시도 시 attempts++, 성공 시 success++, 실패(invalid credentials) 시 failure++.
5. `tooling/docker/observability/prometheus.yml` 에 apps/api scrape target(`host.docker.internal:2026/metrics`) 추가.
6. 카운터 로직은 순수/주입 가능하게 분리 — 단위 테스트(record → metricsText 반영).

### Non-Functional Requirements
1. prom-client 는 framework-agnostic (core 패키지). nestjs 의존 0 (ADR-0015).
2. /metrics 는 시크릿/PII 미포함 (카운터 수치만).
3. prom-client catalog 추가.

## 🚫 Out of Scope
- grafana 대시보드/alert → spec-11-04.
- token.refreshed/session.revoked/mfa 등 전체 카운터 — 본 spec 은 login 3종(브루트포스 핵심) + 확장 패턴. 나머지는 11-04 또는 후속.
- prometheus 가 실제 scrape 하는 live 통합 → phase 시나리오 2 (11-04).
- nestjs observability 어댑터 패키지 — 본 spec 은 apps/api app-level provider 로 wiring.

## 📑 ADR 후보
- [ ] 있음
- [x] 없음 (11-02 backend-observability 연장)

## 🔗 관련 문서 (Related)
- 관련 phase: `backlog/phase-11.md` (§성공 기준 3, §시나리오 2)
- 직전 spec: spec-11-02 (otel-tracing — 동일 패키지)
- 관련 ADR: ADR-0015 (core 경계)

## ✅ Definition of Done
- [ ] `createAuthMetrics` 단위 테스트 PASS (record → metricsText 반영)
- [ ] apps/api `/metrics` 엔드포인트 + 로그인 카운터 wiring (typecheck)
- [ ] prometheus.yml scrape target 추가 (compose config 검증)
- [ ] walkthrough / pr_description ship
- [ ] push + PR (base `phase-11-observability`)
- [ ] 사용자 알림
