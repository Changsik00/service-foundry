# Implementation Plan: spec-10-01

## 📋 Branch Strategy

- 신규 브랜치: `spec-10-01-tooling-docker` (브랜치 이름 = spec 디렉토리 이름, `feature/` prefix 없음)
- 시작 지점: `main`
- 첫 task 가 브랜치 생성을 수행함
- **Base Branch 모드**: phase-10 은 base branch 모드. PR target 은 `phase-10-ops-tooling` (phase base 브랜치). 이 base 브랜치는 첫 spec 의 ship 시점에 just-in-time 생성된다 (constitution §3.1). hk-ship 이 처리하므로 task 단계에서는 spec 브랜치만 `main` 에서 분기한다.

## 🛑 사용자 검토 필요 (User Review Required)

> [!IMPORTANT]
> - [ ] **compose 범위 = 코어(pg+redis) + 관측 stub** — prometheus/grafana/tempo/loki 는 "기동·healthy" 까지만. scrape/dashboard/alert 는 spec-10-06 으로 이월 (사용자 결정 반영).
> - [ ] **base branch 모드** — spec PR 은 main 이 아닌 `phase-10-ops-tooling` 으로 향함 (직전 phase-08/09 와 동일).
> - [ ] **postgres 기본값을 기존 `apps/api/.env` 와 일치** (postgres/postgres/service_foundry_dev/5432) — 앱 코드 변경 없음.

> [!WARNING]
> - [ ] 통합 테스트가 다수 이미지(postgres/redis/prometheus/grafana/tempo/loki)를 pull 하므로 최초 실행 시 네트워크 다운로드 시간이 소요됨.
> - [ ] 로컬에서 5432/6379/9090/3000/3200/3100 포트가 이미 점유돼 있으면 충돌 — `.env` override 또는 기존 서비스 중지 필요.

## 🎯 핵심 전략 (Core Strategy)

### 아키텍처 컨텍스트

```mermaid
flowchart LR
  subgraph compose["tooling/docker/compose.yaml"]
    pg[(postgres:16<br/>:5432)]
    redis[(redis:7<br/>:6379)]
    prom[prometheus<br/>:9090]
    graf[grafana<br/>:3000]
    tempo[tempo<br/>:3200]
    loki[loki<br/>:3100]
  end
  api[apps/api :2026] -->|DATABASE_URL| pg
  smoke[smoke-test.sh] -->|up/health/down| compose
  prom -.scrape config.-> S106[spec-10-06]
  graf -.dashboards/alerts.-> S106
```

### 주요 결정

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| **compose 위치** | `tooling/docker/compose.yaml` | phase-10 `tooling/` 레이아웃 컨벤션 |
| **postgres** | `postgres:16-alpine`, named volume, healthcheck `pg_isready` | 기존 `.env` 와 일치 → 앱 무변경 연결 |
| **redis** | `redis:7-alpine`, healthcheck `redis-cli ping` | 인프라 준비(앱 연동은 후속) |
| **관측 4종** | 이미지 pin + 최소 config + healthcheck | "healthy 부트"만, 실제 구성은 spec-10-06 |
| **prometheus config** | `observability/prometheus.yml` self-scrape 최소본 | 기동 가능한 최소 stub |
| **grafana** | env(admin pass)만, provisioning 없음 | 대시보드/데이터소스는 spec-10-06 |
| **tempo/loki** | `observability/{tempo,loki}.yaml` 단일노드 최소본 | 기동·healthy 만 |
| **DX** | 루트 `infra:up/down/logs` 스크립트 | 한 줄 부트 ergonomics |
| **테스트** | `compose config`(단위) + `smoke-test.sh`(통합) | 인프라 검증의 현실적 형태 |

### 📑 ADR 후보

- [x] ADR 가치 있는 결정 있음 → 후보 한 줄 요약: `tooling-layout` (type: convention) — phase 전반 누적 후 결정 권장. 본 spec 은 walkthrough 기록.
- [ ] 없음

## 📂 Proposed Changes

### tooling/docker (신규)

#### [NEW] `tooling/docker/compose.yaml`
6개 서비스 정의(postgres, redis, prometheus, grafana, tempo, loki). 각 서비스 healthcheck + 이미지 pin. postgres named volume. 환경변수 override 가능한 기본값.

#### [NEW] `tooling/docker/observability/prometheus.yml`
self-scrape 최소 config (global scrape_interval + prometheus job). scrape target 확장은 spec-10-06.

#### [NEW] `tooling/docker/observability/tempo.yaml`
단일노드 최소 config (기동·healthy 목적).

#### [NEW] `tooling/docker/observability/loki.yaml`
단일노드 최소 config (기동·healthy 목적).

#### [NEW] `tooling/docker/.env.example`
override 가능한 변수 문서화(POSTGRES_USER/PASSWORD/DB/PORT, REDIS_PORT, 관측 포트). 기본값은 `apps/api/.env` 와 일치.

#### [NEW] `tooling/docker/smoke-test.sh`
`compose up -d` → 헬스 폴링(타임아웃) → pg_isready / redis ping / 관측 health 엔드포인트 검증 → `compose down -v`. exit code 반환.

#### [NEW] `tooling/docker/README.md`
사용법(infra:up/down/logs), 포트 표, override 방법, spec-10-06 과의 경계 명시.

### 루트

#### [MODIFY] `package.json`
`infra:up` / `infra:down` / `infra:logs` 스크립트 추가.

## 🧪 검증 계획 (Verification Plan)

### 단위 테스트 (필수)
```bash
docker compose -f tooling/docker/compose.yaml config --quiet
```
compose 파일이 스키마상 유효하면 exit 0. 각 service 추가 commit 직전 실행.

### 통합 테스트 (Integration Test Required = yes)
```bash
bash tooling/docker/smoke-test.sh
```
up → 6개 서비스 healthy 폴링 → pg_isready + redis PONG + prometheus/grafana/tempo/loki health 확인 → down. 모두 통과 시 exit 0.

### 수동 검증 시나리오
1. `pnpm infra:up` → `docker compose ps` 로 6개 서비스 `healthy` 확인 — 기대: 전부 healthy.
2. `psql postgres://postgres:postgres@localhost:5432/service_foundry_dev -c '\l'` — 기대: DB 접속 성공.
3. `redis-cli -p 6379 ping` — 기대: `PONG`.
4. `pnpm infra:down` → 컨테이너 정리 확인.

## 🔁 Rollback Plan

- 본 spec 은 신규 파일 추가 + `package.json` 스크립트 추가뿐 — 기존 앱/패키지 코드 무변경. 문제 시 `tooling/docker/` 삭제 + `package.json` 스크립트 3줄 제거로 완전 롤백.
- 데이터 영향: named volume 은 로컬 개발 데이터만 — 운영 데이터 영향 없음.

## 📦 Deliverables 체크

- [ ] task.md 작성 (다음 단계)
- [ ] 사용자 Plan Accept 받음
- [ ] (실행 후) 모든 task 완료
- [ ] (실행 후) walkthrough.md / pr_description.md ship
