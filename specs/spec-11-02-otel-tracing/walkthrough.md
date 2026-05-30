# Walkthrough: spec-11-02

> OTEL 분산추적 — `@repo/backend-observability` + apps/api → tempo.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 패키지 위치 | apps/api 직접 / core 패키지 | **`@repo/backend-observability`** (core) | 재사용 + framework-agnostic (ADR-0015) |
| 활성화 | 항상 / opt-in | **opt-in** (OTLP endpoint 설정 시만) | 미설정 시 부트 불변 — 0 영향 |
| init 순서 | 일반 import / 최상단 | **main.ts 최상단 `import "./tracing.js"`** | 자동계측이 @nestjs/pg/http require 전 패치 |
| 샘플링 | 명시 sampler / env | **OTEL 표준 env**(OTEL_TRACES_SAMPLER_ARG) | 추가 dep 회피, config.sampleRatio 는 파싱·보유 |
| 통합 테스트 | full apps/api 부트 / 패키지→tempo 직접 | **패키지→tempo 직접** | 전체 스택 부트 회피, export 경로만 검증 |
| 패키지 scaffold | 수동 / 생성기 | **`pnpm new package` (dogfood)** | spec-11-01 생성기 실증 |

### ADR 승격
- [x] 후보: `backend-observability-package` — phase 누적 후 검토 (본 spec 은 walkthrough 기록)

## 💬 사용자 협의
- phase-11 관측 코어의 첫 조각. 다음 11-03(metrics)/11-04(grafana)가 본 패키지 위에 쌓임.

## 🧪 검증 결과

### 단위
- **명령**: `pnpm --filter @repo/backend-observability test`
- **결과**: ✅ 7 passed (resolveTracingConfig 5 + tracing 2)

### 통합 (Integration Test Required = yes)
- **명령**: `bash packages/backend/observability/smoke-trace.sh`
- **결과**: ✅ tempo 기동 → 패키지로 span 방출 → tempo query API 재조회 확인
```text
✓ span 방출 — traceId=...
✓ tempo 에서 trace 확인 — export 경로 정상
```

### 수동
1. `env -u OTEL_EXPORTER_OTLP_ENDPOINT tsx apps/api/src/tracing.ts` → exit 0 (no-op, 부트 불변)
2. apps/api typecheck + compose config 통과

## 🔍 발견 사항
- **TDD Red under typecheck gate**: workspace 패키지는 `turbo typecheck` 대상이라, 미존재 모듈 import 시 TS2307 로 커밋 차단. **throwing 스텁**(시그니처 존재 → typecheck 통과, 본문 throw → 테스트 실패)으로 Red 커밋 가능.
- **tempo query 는 traceId 를 base64 로 반환** — hex grep 대신 본문 존재(batches/resourceSpans)로 판정.
- 생성기로 패키지 scaffold 실증(dogfood) — spec-11-01 산출물이 바로 활용됨.

## 🚧 이월 항목
- metrics(/metrics, prometheus) → spec-11-03
- grafana 대시보드/alert → spec-11-04
- custom 도메인 span(수동 계측) → 후속

## 🔗 관련
- 관련 phase: `backlog/phase-11.md` (§성공 기준 2, §시나리오 2)
- 관련 ADR: ADR-0015 (core/adapter)
- 직전 spec: spec-11-01 (app-generator — scaffold 에 사용)

## 📅 메타
| 항목 | 값 |
|---|---|
| 작성자 | Agent + dennis |
| 작성일 | 2026-05-30 |
| 최종 commit | ship 시 갱신 |
