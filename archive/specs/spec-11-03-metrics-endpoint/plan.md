# Implementation Plan: spec-11-03

## 📋 Branch Strategy
- 신규 브랜치: `spec-11-03-metrics-endpoint` (from `phase-11-observability`)
- base 모드: PR target = `phase-11-observability`

## 🛑 사용자 검토 필요
> [!IMPORTANT]
> - [ ] metrics primitives 는 `@repo/backend-observability`(core, prom-client). nestjs 어댑터는 후속 — 본 spec 은 apps/api app-level provider 로 wiring.
> - [ ] login 카운터 3종(attempts/success/failure)만 — 브루트포스 관측 핵심. 나머지 카운터는 후속.
> - [ ] prom-client catalog 추가.

> [!WARNING]
> - [ ] /metrics 인증 미적용 (내부 스크랩 전제) — 외부 노출 시 보호는 후속/11-04 검토.
> - [ ] prometheus(docker)→apps/api(host) scrape 는 `host.docker.internal` 사용 (mac/win). live 검증은 phase 시나리오 2.

## 🎯 핵심 전략

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| metrics | `@repo/backend-observability` `createAuthMetrics()` (prom-client Registry + 카운터) | core 재사용, 단위 테스트 |
| 엔드포인트 | apps/api `MetricsController GET /metrics` | prom scrape 표준 |
| wiring | auth controller signin 경계 (attempt/success/failure) | 브루트포스 관측 핵심, 비침습 |
| DI | apps/api app-level provider(AUTH_METRICS) | nestjs 어댑터 패키지는 후속 |
| scrape | prometheus.yml + host.docker.internal:2026 | docker→host |
| 테스트 | 단위(record→metricsText) + typecheck + compose config | bounded |

## 📂 Proposed Changes

### @repo/backend-observability
- [NEW] `src/metrics.ts` — `createAuthMetrics()` → Registry + recordLoginAttempt/Success/Failure + metricsText() (+ `.test.ts`)
- [MODIFY] `src/index.ts` — export
- [MODIFY] package.json — `prom-client` (catalog)

### apps/api
- [NEW] `src/metrics/metrics.controller.ts` — `GET /metrics` (text/plain)
- [NEW] `src/metrics/auth-metrics.provider.ts` — AUTH_METRICS provider(createAuthMetrics 싱글톤)
- [MODIFY] `src/app.module.ts` — provider + controller 등록
- [MODIFY] `src/auth/auth.controller.ts` (signin 핸들러) — attempt/success/failure 카운터 증가

### tooling/docker
- [MODIFY] `observability/prometheus.yml` — apps/api scrape job(host.docker.internal:2026)

### 루트
- [MODIFY] pnpm-workspace.yaml — `prom-client` catalog

## 🧪 검증 계획

### 단위
```bash
pnpm --filter @repo/backend-observability test
```
record* → metricsText() 에 `auth_login_*_total` 반영.

### 정적/구성
```bash
pnpm --filter @apps/api typecheck
docker compose -f tooling/docker/compose.yaml config --quiet
```

### 수동
1. apps/api 부트 → `curl localhost:2026/metrics` → `auth_login_attempts_total` 등 노출.
2. 로그인 실패 → `auth_login_failure_total` 증가.

## 🔁 Rollback
- backend-observability metrics 추가 + apps/api 3파일 + prometheus.yml + auth.controller wiring. 카운터 wiring 제거 + /metrics 제거로 롤백. trace(11-02) 영향 없음.

## 📦 Deliverables
- [ ] task.md 작성
- [ ] Plan Accept
- [ ] (실행 후) walkthrough / pr_description ship
