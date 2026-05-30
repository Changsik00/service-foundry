# spec-10-01: 로컬 인프라 docker-compose 스택

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-10-01` |
| **Phase** | `phase-10` |
| **Branch** | `spec-10-01-tooling-docker` |
| **상태** | Planning |
| **타입** | Feature |
| **Integration Test Required** | yes |
| **작성일** | 2026-05-30 |
| **소유자** | dennis |

## 📋 배경 및 문제 정의

### 현재 상황

phase-09까지 완료되어 `apps/api`(:2026) / `apps/web-next`(:2027) / `apps/web-vite`(:2028) 세 앱이 부트 가능하다. 그러나 `apps/api`가 의존하는 외부 인프라는 **수동으로** 띄워야 한다:

- **PostgreSQL**: `apps/api/.env` 의 `DATABASE_URL=postgres://postgres:postgres@localhost:5432/service_foundry_dev` — Drizzle(`@repo/backend-database`)가 연결.
- **Redis**: 아직 앱 코드에서 사용하지 않으나, phase-10 계획상 세션/캐시 가속용으로 인프라 준비 대상.
- **Observability**: prometheus / grafana / tempo / loki — phase-10 성공 기준 1번에 compose 부트 대상으로 명시.

로컬 개발자/CI 가 매번 이 서비스들을 개별 설치·기동해야 하므로 온보딩 비용과 환경 편차가 크다.

### 문제점

- 신규 개발자가 `apps/api`를 띄우려면 Postgres를 직접 설치하고 정확한 user/pass/db명/포트를 맞춰야 한다 — 환경 편차로 인한 "내 머신에선 됨" 문제.
- phase-10 후속 spec(특히 spec-10-06 auth-observability)이 의존할 관측 스택의 부트 수단이 없다.
- 통합 테스트(phase-10 시나리오 1)가 "한 줄 부트"를 전제로 하는데 그 기반이 없다.

### 해결 방안 (요약)

`tooling/docker/compose.yaml` 를 신설하여 `docker compose -f tooling/docker/compose.yaml up` 한 줄로 **postgres + redis(코어)** 와 **prometheus + grafana + tempo + loki(관측 stub)** 를 기동한다. postgres/redis 는 healthcheck + 앱 연결까지 완성하고, 관측 4종은 "기동·healthy" 수준의 stub 으로 포함하되 실제 scrape/dashboard/alert 구성은 **spec-10-06** 으로 이월한다. 루트 `package.json` 에 `infra:up/down/logs` 스크립트를 추가해 DX를 보강한다.

## 🎯 요구사항

### Functional Requirements

1. `docker compose -f tooling/docker/compose.yaml config` 가 오류 없이 통과한다 (compose 스키마 유효성).
2. `docker compose -f tooling/docker/compose.yaml up -d` 로 6개 서비스(postgres, redis, prometheus, grafana, tempo, loki)가 기동되고 모두 `healthy` 상태가 된다.
3. postgres 서비스는 `apps/api/.env` 의 기본값(user=postgres, pass=postgres, db=service_foundry_dev, port=5432)과 일치하여, 별도 앱 코드 변경 없이 `apps/api` 가 연결 가능하다.
4. postgres 데이터는 named volume 에 영속되어 컨테이너 재기동 후에도 유지된다.
5. redis 는 6379 포트로 기동되고 `redis-cli ping` 에 `PONG` 으로 응답한다 (앱 연동은 본 spec 범위 밖, 인프라 준비만).
6. 루트 `package.json` 에 `infra:up`, `infra:down`, `infra:logs` 스크립트를 추가한다.
7. `tooling/docker/smoke-test.sh` 가 up → 헬스 폴링 → 검증 → down 을 수행하고 성공/실패를 exit code 로 반환한다.

### Non-Functional Requirements

1. 모든 서비스에 healthcheck 를 정의하여 "한 줄 부트" 신뢰성을 확보한다.
2. 포트/계정/DB명은 환경변수로 override 가능하되, 기본값은 기존 `apps/api/.env` 와 충돌·중복되지 않게 일치시킨다.
3. compose 파일과 부속 config 는 `tooling/docker/` 아래에 모아 phase-10 의 `tooling/` 레이아웃 컨벤션을 따른다.
4. 관측 stub 의 이미지 버전은 핀 고정(pin)하여 재현성을 확보한다.

## 🚫 Out of Scope

- **Prometheus scrape target / Grafana dashboard·datasource provisioning / Tempo·Loki 실제 파이프라인 / alert rule** → spec-10-06 (auth-observability-dashboards).
- **앱 측 Redis 연동 코드** (현재 앱은 Redis 미사용) — 인프라 준비만, 코드 연동은 후속.
- **테스트 전용 DB(:5434) 프로파일** (e2e 테스트용) — 별도 후속 또는 spec-10-04 인접 작업에서 결정.
- **앱 컨테이너화(Dockerfile)** — phase-11(CI/CD) 후보.
- **CI 파이프라인에서의 compose 기동** — phase-11.

## 📑 ADR 후보 (Architecture Decision Records)

- [x] ADR 가치 있는 결정 있음 → 후보 한 줄 요약: `tooling-layout` — `tooling/{docker,generators,scripts}` 디렉토리 컨벤션 (type: convention). 단 phase-10 전반에 걸친 컨벤션이므로 본 spec 단독 ADR 보다 phase 진행 중 누적 후 박는 것을 권장. 본 spec 에서는 walkthrough 기록으로 충분.
- [ ] 없음

## 🔗 관련 문서 (Related)

- 관련 phase: `backlog/phase-10.md` (§성공 기준 1, §통합 테스트 시나리오 1)
- 관련 ADR: ADR-0002 (locked stack), ADR-0005 (Drizzle 단일)
- 관련 design note: `docs/notes/auth-foundation-architecture.md` §Observability (spec-10-06 에서 본격 사용)
- 후속 spec: `spec-10-06` (auth-observability-dashboards)

## ✅ Definition of Done

- [ ] 모든 단위 테스트(`docker compose config` 검증) PASS
- [ ] 통합 테스트(`tooling/docker/smoke-test.sh` — up/health/down) PASS
- [ ] `walkthrough.md` 와 `pr_description.md` 작성 및 ship commit
- [ ] `spec-10-01-tooling-docker` 브랜치 push 완료
- [ ] 사용자 검토 요청 알림 완료
