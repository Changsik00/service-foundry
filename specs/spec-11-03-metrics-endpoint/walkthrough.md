# Walkthrough: spec-11-03

> 메트릭 엔드포인트 + auth 로그인 카운터 (prom-client → prometheus).

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| metrics 위치 | apps/api / core 패키지 | **`@repo/backend-observability`** (core) | 11-02 와 동일 패키지, framework-agnostic |
| DI 배선 | 모듈별 / @Global | **@Global ObservabilityModule** | AUTH_METRICS 를 app + AuthModule 양쪽에서 주입 |
| 카운터 범위 | 전체 / login 3종 | **login attempts/success/failure** | 브루트포스 관측 핵심 (시나리오 2). 나머지는 동일 패턴 후속 |
| 카운터 wiring | 서비스 / controller 경계 | **auth.controller signin** | try/catch 경계가 성공·실패 분기 명확, 비침습 |
| scrape | — | prometheus.yml + host.docker.internal:2026 | docker→host apps/api |
| nestjs 어댑터 | 신설 / app-level | **app-level provider** | 어댑터 패키지는 후속 (범위 한정) |

### ADR 승격
- [x] 없음 (11-02 backend-observability 연장)

## 💬 사용자 협의
- phase-11 관측 코어 두 번째 조각. 11-04(grafana)가 이 메트릭 위에 대시보드/alert 를 올림.

## 🧪 검증 결과

### 단위
- **명령**: `pnpm --filter @repo/backend-observability test`
- **결과**: ✅ 10 passed (config 5 + tracing 2 + **metrics 3**: record→metricsText 반영)

### 정적/구성
- apps/api typecheck ✅ / `docker compose config` ✅
- auth.controller.test ✅ 10 passed (AUTH_METRICS mock provider 추가)

### 수동 검증 경로
1. apps/api 부트 → `GET /metrics` → `auth_login_*_total` prom text 노출
2. 로그인 실패 → `auth_login_failure_total` 증가 (controller catch 경계)

## 🔍 발견 사항
- auth.controller 에 신규 required 의존(AUTH_METRICS) 추가 → 기존 controller 테스트 DI 깨짐 → 테스트 모듈에 mock provider 추가 필요(회귀 즉시 수정). 새 주입 추가 시 관련 TestingModule 동반 갱신이 패턴.
- prom-client 라벨 없는 카운터는 `registry.metrics()` 에 0 으로도 노출 → 대시보드 초기값 표시 OK.

## 🚧 이월 항목
- grafana datasource/dashboard + alert(brute force) → spec-11-04 (이 카운터 사용)
- token.refreshed/session.revoked/mfa 카운터 → 후속 (동일 패턴)
- nestjs-observability 어댑터 패키지 → 후속
- prometheus 실제 scrape live 검증 → phase 시나리오 2 (11-04)

## 🔗 관련
- 관련 phase: `backlog/phase-11.md` (§성공 기준 3, §시나리오 2)
- 직전 spec: spec-11-02 (otel-tracing — 동일 패키지)

## 📅 메타
| 항목 | 값 |
|---|---|
| 작성자 | Agent + dennis |
| 작성일 | 2026-05-30 |
| 최종 commit | ship 시 갱신 |
