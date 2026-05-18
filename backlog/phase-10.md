# phase-10: Ops & Tooling

> service-foundry의 *차별화 영역*. docker-compose / generator / manifest/report + auth observability dashboards.
> 본래 phase-05 본문 이전 + auth observability(brute force / impossible travel / refresh reuse alert) 추가.

## 📋 메타

| 항목 | 값 |
|---|---|
| **Phase ID** | `phase-10` |
| **상태** | Backlog |
| **시작일** | 미정 |
| **목표 종료일** | 미정 |
| **소유자** | dennis |
| **Base Branch** | 미정 |

## 🎯 배경 및 목표

### 현재 상황

phase-09까지 끝나면 apps/api + apps/web-* + apps/admin + apps/worker + apps/edge-api 부트 가능하나, 외부 의존(Postgres / Redis / 관찰 도구) 부트는 *수동*. 신규 패키지/앱 생성 시 보일러플레이트 코드 복붙 비용. 또한 *auth 보안 관찰 영역*(brute force / impossible travel / refresh reuse)이 metric/alert로 연결되어야 *프로덕션 신뢰성* 확보.

### 목표 (Goal)

`tooling/docker/` 로컬 인프라 한 줄 부트, `tooling/generators/` `pnpm new package` / `pnpm new app` 자동화, `tooling/scripts/` service-manifest / startup-report / typed-config-graph + auth observability dashboards (Prometheus metric + Grafana panel + alert rule).

### 성공 기준 (Success Criteria) — 정량 우선

1. `docker compose -f tooling/docker/compose.yaml up` 한 줄로 postgres + redis + prometheus + grafana + tempo + loki 부트.
2. `pnpm new package <name>` / `pnpm new app <name>` 실행 시 ADR-0003 layout + `@repo/*` 네이밍에 맞춰 스캐폴딩.
3. apps/api 부트 시 startup report (masked config dump) stdout/log 출력.
4. apps/* `service.yaml` 작성 + manifest validator로 검증.
5. typed config graph 명령(`pnpm tooling:config-graph`)이 의존 그래프 출력.
6. **Auth observability**: Prometheus metric (auth.login.attempts / auth.login.failure / auth.token.refreshed 등) + Grafana dashboard + alert rule (brute force / impossible travel / refresh reuse).

## 🧩 작업 단위 (SPECs)

<!-- sdd:specs:start -->
| ID | 슬러그 | 우선순위 | 상태 | 디렉토리 |
|---|---|:---:|---|---|
<!-- sdd:specs:end -->

### spec-10-01 — tooling-docker

- **요점**: `tooling/docker/compose.yaml` — postgres + redis + prometheus + grafana + tempo + loki.
- **연관 모듈**: `tooling/docker/`

### spec-10-02 — tooling-generators

- **요점**: plop 기반 `pnpm new package` / `pnpm new app`. ADR-0003 layout 자동 적용.
- **연관 모듈**: `tooling/generators/`

### spec-10-03 — tooling-script-service-manifest

- **요점**: 각 app의 `service.yaml` (port / expose / depends) + manifest validator.
- **연관 모듈**: `tooling/scripts/manifest/`

### spec-10-04 — tooling-script-startup-report

- **요점**: apps/api 부트 시 masked config dump.
- **연관 모듈**: `tooling/scripts/startup-report/` + backend/settings

### spec-10-05 — tooling-script-typed-config-graph

- **요점**: backend/settings의 config schema 트리 → dot/mermaid export.
- **연관 모듈**: `tooling/scripts/config-graph/`

### spec-10-06 — auth-observability-dashboards

- **요점**: Prometheus metric collection + Grafana panel + alert rule.
- **참조**: design note §Observability.
- **메트릭**: auth.login.attempts / .success / .failure / auth.token.issued / .refreshed / auth.session.revoked / auth.mfa.challenged
- **알림**: brute force / impossible travel (geo) / mass session revocation / refresh reuse 감지
- **연관 모듈**: `tooling/grafana/` + apps/api metric endpoint

### spec-10-07 — security-linter-evaluation (조건부)

- **요점**: semgrep / socket.dev 평가 + 결정. Icebox 이슈 해소.
- **연관 모듈**: 결정 따라 변경

## 📌 결정 기록 (Review)

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 통합 테스트 orchestration | testcontainers / docker-compose snapshot | 진입 시 결정 | per-test 격리 vs 전체 환경 trade-off |
| 보안 linter | semgrep / socket.dev / 없음 | spec-10-07에서 결정 | 도입 시 ADR로 박을 가치 |

## 🧪 통합 테스트 시나리오 (간결)

### 시나리오 1: 로컬 인프라 한 줄 부트

- **Given**: spec-10-01 머지됨.
- **When**: `docker compose -f tooling/docker/compose.yaml up -d` 후 30초 대기.
- **Then**: 모든 서비스 healthy + apps/api 부트가 connect 가능.

### 시나리오 2: generator round-trip

- **Given**: spec-10-02 머지됨.
- **When**: `pnpm new package shared-foo` → 생성된 디렉토리에서 lint/typecheck/test.
- **Then**: 0 error.

### 시나리오 3: auth observability alert

- **Given**: spec-10-06 머지됨.
- **When**: brute force 시뮬레이션 (동일 IP에서 N회 login 실패).
- **Then**: Grafana alert 발생 + Prometheus metric 카운트 증가.

## 🔗 의존성

- **선행 phase**: phase-09 (apps).
- **외부 시스템**: Docker engine.
- **연관 ADR**: 0002 + locked stack memory (node-settings)
- **연관 design note**: `docs/notes/auth-foundation-architecture.md` §Observability

## 🏁 Phase Done 조건

- [ ] 모든 SPEC(spec-10-01 ~ spec-10-06, 조건부 spec-10-07) main에 merge
- [ ] 성공 기준 6개 충족
- [ ] 통합 테스트 3개 시나리오 PASS
- [ ] 사용자 최종 승인
