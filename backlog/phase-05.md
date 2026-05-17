# phase-05: 운영 / 도구 (Ops & Tooling)

> service-foundry의 *차별화 영역*. 대부분 보일러플레이트가 "앱 생성"까지만 다루는 데 비해 본 phase는 운영 도구(docker-compose, generator, manifest/report)를 흡수한다.

## 📋 메타

| 항목 | 값 |
|---|---|
| **Phase ID** | `phase-05` |
| **상태** | Backlog |
| **시작일** | 미정 |
| **목표 종료일** | 미정 |
| **소유자** | dennis |
| **Base Branch** | 미정 |

## 🎯 배경 및 목표

### 현재 상황

Phase 4가 끝나면 apps/api + apps/web-*가 부트되지만, 외부 의존(Postgres / Redis / 관찰 도구) 부트는 수동. 또한 신규 패키지/앱 생성 시 보일러플레이트 코드를 매번 복붙하는 비용이 있다. 본 phase는 이 두 영역을 자동화한다.

또한 service-foundry의 *운영 친화* 차별화 포인트 중 일부(service manifest, startup report, typed config graph)가 본 phase에 속한다.

### 목표 (Goal)

`tooling/docker/`로 로컬 인프라 한 줄 부트, `tooling/generators/`로 `pnpm new package` / `pnpm new app` 한 줄 생성, `tooling/scripts/`로 service-manifest / startup-report / typed-config-graph 자동화.

### 성공 기준 (Success Criteria) — 정량 우선

1. `docker compose -f tooling/docker/compose.yaml up` 한 줄로 postgres + redis + prometheus + grafana + tempo + loki 부트.
2. `pnpm new package <name>` / `pnpm new app <name>` 실행 시 ADR-0003 layout + `@repo/*` 네이밍에 맞춰 스캐폴딩됨.
3. apps/api 부트 시 startup report(masked config dump)가 stdout/log에 출력.
4. apps/* 각각의 `service.yaml` (port / expose / depends)가 작성되고 manifest validator로 검증 가능.
5. typed config graph 명령(가칭 `pnpm tooling:config-graph`)이 config 의존 그래프를 출력 (dot/mermaid).

## 🧩 작업 단위 (SPECs)

<!-- sdd:specs:start -->
| ID | 슬러그 | 우선순위 | 상태 | 디렉토리 |
|---|---|:---:|---|---|
<!-- sdd:specs:end -->

> 상태 허용값: `Backlog` / `In Progress` / `Merged`

### spec-05-01 — tooling-docker

- **요점**: `tooling/docker/compose.yaml` — postgres + redis + prometheus + grafana + tempo + loki.
- **방향성**: apps/api dev 모드 부트 시 한 번에 띄울 수 있도록 healthcheck 포함. observability 스택은 OTel collector를 통해 tempo/loki에 push.
- **연관 모듈**: `tooling/docker/`

### spec-05-02 — tooling-generators

- **요점**: plop 기반 `pnpm new package` / `pnpm new app`.
- **방향성**: 신규 패키지/앱 생성 시 ADR-0003 layout + `@repo/<category>/<pkg>` 네이밍 자동 적용. tsconfig / vitest / package.json 보일러플레이트 자동 작성.
- **연관 모듈**: `tooling/generators/`

### spec-05-03 — tooling-script-service-manifest

- **요점**: 각 app의 `service.yaml` (port / expose / depends) 작성 + manifest validator.
- **방향성**: service-foundry의 차별화 포인트 "service manifest"의 본격화. 자체 구현. apps/* 새로 추가 시 validator가 누락 검출.
- **연관 모듈**: `tooling/scripts/manifest/`

### spec-05-04 — tooling-script-startup-report

- **요점**: apps/api 부트 시 masked config dump.
- **방향성**: backend/settings(Phase 3)가 노출한 config schema를 기반으로 secret을 mask해 출력. dev / staging / prod 환경 차이 명확화.
- **연관 모듈**: `tooling/scripts/startup-report/` + `packages/backend/settings` 통합

### spec-05-05 — tooling-script-typed-config-graph

- **요점**: typed config 의존 그래프 시각화.
- **방향성**: backend/settings의 config schema 트리를 dot/mermaid로 export. AI 에이전트와 사람 모두에게 "어떤 config가 어디서 쓰이는지" 한눈에 보이게.
- **연관 모듈**: `tooling/scripts/config-graph/`

### spec-05-06 — security-linter-evaluation (조건부)

- **요점**: semgrep / socket.dev 등 보안 linter 추가 여부 평가 + 결정.
- **방향성**: Icebox 이슈("보안 linter 추가 여부 — ADR 후보") 결정 결과를 spec으로 끊거나 ADR로 작성. Phase 5 이전 결정.
- **연관 모듈**: 결정 따라 변경

## 📌 결정 기록 (Review)

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 통합 테스트 orchestration | testcontainers / docker-compose snapshot | 미정 (Icebox) | per-test 격리 vs 전체 환경 미리 부팅 trade-off |
| 보안 linter | semgrep / socket.dev / 없음 | 미정 (Icebox, ADR 후보) | 도입 시 ADR로 박을 가치 있음 |

## 🧪 통합 테스트 시나리오 (간결)

### 시나리오 1: 로컬 인프라 한 줄 부트

- **Given**: spec-05-01 머지됨.
- **When**: `docker compose -f tooling/docker/compose.yaml up -d` 후 30초 대기.
- **Then**: 모든 서비스 healthy + apps/api 부트가 connect 가능.
- **연관 SPEC**: spec-05-01

### 시나리오 2: generator round-trip

- **Given**: spec-05-02 머지됨.
- **When**: `pnpm new package shared-foo` → 생성된 디렉토리에서 `pnpm lint typecheck test` 실행.
- **Then**: 0 error.
- **연관 SPEC**: spec-05-02

### 시나리오 3: startup report + manifest

- **Given**: spec-05-03 + spec-05-04 머지됨.
- **When**: apps/api 부트.
- **Then**: stdout에 masked config dump + `apps/api/service.yaml` validator 통과.
- **연관 SPEC**: spec-05-03, spec-05-04

### 통합 테스트 실행

```bash
docker compose -f tooling/docker/compose.yaml up -d
pnpm --filter @apps/api dev
pnpm tooling:manifest:validate
pnpm tooling:config-graph
```

## 🔗 의존성

- **선행 phase**: phase-04 (apps가 있어야 manifest / startup-report 의미 있음).
- **외부 시스템**: Docker engine.
- **연관 ADR**:
  - `docs/adr/0002-monorepo-foundations.md` (pnpm catalog / lefthook)
  - locked stack memory (node-settings)

## 📝 위험 요소 및 완화

| 위험 | 영향 | 완화책 |
|---|---|---|
| docker-compose 스택의 리소스 부담 | dev 머신 메모리 압박 | observability 서비스(tempo/loki/grafana)는 optional profile로 분리 |
| generator 템플릿이 ADR 변경에 따라 stale | 신규 패키지가 outdated 구조로 생성 | ADR 변경 시 generator 템플릿 동기화 spec을 ADR PR에 묶음 |
| service manifest validator의 cross-app 룰 부재 | 잘못된 의존 관계 미검출 | spec-05-03에서 cross-app 의존 ruleset 정의 |

## 🏁 Phase Done 조건

- [ ] 모든 SPEC(spec-05-01 ~ spec-05-05, 조건부 spec-05-06) main에 merge
- [ ] 성공 기준 5개 충족
- [ ] 통합 테스트 3개 시나리오 PASS
- [ ] 사용자 최종 승인

## 📊 검증 결과 (phase 완료 시 작성)

<!-- 통합 테스트 로그, 성공 기준 측정값, 회귀 점검 결과 등을 여기 첨부 -->
