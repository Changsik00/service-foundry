# Implementation Plan: spec-11-02

## 📋 Branch Strategy
- 신규 브랜치: `spec-11-02-otel-tracing` (from `phase-11-observability`)
- base 모드: PR target = `phase-11-observability`

## 🛑 사용자 검토 필요
> [!IMPORTANT]
> - [ ] **신규 패키지 `@repo/backend-observability`** (core, framework-agnostic) + OTEL 의존(@opentelemetry/*) catalog 추가.
> - [ ] apps/api OTEL init 은 **opt-in**(OTLP endpoint 설정 시만) — 미설정 시 부트 불변.
> - [ ] compose tempo 에 OTLP 4317/4318 노출.

> [!WARNING]
> - [ ] OTEL init 은 계측 대상보다 먼저 로드돼야 함 — `main.ts` 최상단 import 순서 중요.
> - [ ] 통합 테스트가 tempo(docker)를 기동 → 느림. 호스트 포트 충돌 시 override.

## 🎯 핵심 전략

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| 패키지 | `@repo/backend-observability` (packages/backend/observability) | core 재사용, ADR-0015 |
| 설정 | `resolveTracingConfig(env)` 순수 함수 | enabled/endpoint/serviceName/sampling 테스트 |
| SDK | `createTracingSdk` → NodeSDK + OTLPTraceExporter(proto) + auto-instrumentations | 표준 OTEL |
| apps/api | `src/tracing.ts` (init) + `main.ts` 최상단 import (env-gated) | 계측 순서 보장 + opt-in |
| compose | tempo OTLP 4317/4318 노출 | 호스트 apps/api → tempo 수신 |
| 테스트 | 단위(config) + 통합(span→tempo query) | full apps/api 부트 회피 |

### 📑 ADR 후보
- [x] `backend-observability-package` — 머지 시 검토.

## 📂 Proposed Changes

### @repo/backend-observability (신규)
- [NEW] `packages/backend/observability/src/config.ts` — `resolveTracingConfig(env)` (+ `.test.ts`)
- [NEW] `packages/backend/observability/src/tracing.ts` — `createTracingSdk(config)` (NodeSDK 구성)
- [NEW] `packages/backend/observability/src/index.ts` — export
- [NEW] package.json / tsconfig / vitest.config — backend 카테고리 표준 (생성기로 scaffold 가능)
- OTEL 의존: `@opentelemetry/{api,sdk-node,auto-instrumentations-node,exporter-trace-otlp-proto,resources,semantic-conventions}` (catalog)

### apps/api
- [NEW] `apps/api/src/tracing.ts` — `resolveTracingConfig(process.env)` → enabled 면 `createTracingSdk().start()`
- [MODIFY] `apps/api/src/main.ts` — **최상단** `import "./tracing.js"` (reflect-metadata 전후 순서 확인)
- [MODIFY] `apps/api/.env`(예시는 env 보호로 README/주석) — `OTEL_EXPORTER_OTLP_ENDPOINT` 안내

### tooling/docker
- [MODIFY] `compose.yaml` tempo — `4317:4317`, `4318:4318` 노출 (+ env override)

### 테스트
- [NEW] `packages/backend/observability/src/config.test.ts` — enabled/endpoint/serviceName/sampling
- [NEW] `packages/backend/observability/smoke-trace.ts` + `tooling/docker/...` 또는 `turbo`-less 스크립트 — span 방출 → tempo `/api/traces/<id>` 조회

## 🧪 검증 계획

### 단위
```bash
pnpm --filter @repo/backend-observability test
```
`resolveTracingConfig` 분기 검증.

### 통합 (Integration Test Required = yes)
```bash
bash packages/backend/observability/smoke-trace.sh
```
tempo 기동(포트 override) → 패키지로 known traceId span 방출 → flush → tempo query API 에서 trace 조회 → 확인 → 정리.

### 수동
1. `OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318 pnpm dev:api` → /health 요청 → tempo 에 trace.
2. endpoint 미설정 부트 → 정상(추적 비활성).

## 🔁 Rollback
- 신규 패키지 + apps/api 2파일 + compose 포트뿐. OTEL 미설정 시 동작 불변 → endpoint 환경변수 제거로 즉시 비활성. 패키지/import 제거로 완전 롤백.

## 📦 Deliverables
- [ ] task.md 작성
- [ ] Plan Accept
- [ ] (실행 후) walkthrough / pr_description ship
