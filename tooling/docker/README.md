# tooling/docker — 로컬 인프라 스택

`apps/*` 가 의존하는 외부 인프라(데이터 + 관측)를 **한 줄로** 띄운다.

## 빠른 시작

```bash
pnpm infra:up      # 백그라운드 기동
pnpm infra:logs    # 로그 follow
pnpm infra:down    # 정리 (volume 은 유지)
```

직접 호출:

```bash
docker compose -f tooling/docker/compose.yaml up -d
docker compose -f tooling/docker/compose.yaml down -v   # -v: volume 까지 삭제
```

## 서비스 / 포트

| 서비스 | 이미지 | 포트 | 역할 | 상태 |
|---|---|:---:|---|---|
| **postgres** | `postgres:16-alpine` | 5432 | `apps/api` 메인 DB (Drizzle) | 코어 (앱 연결) |
| **redis** | `redis:7-alpine` | 6379 | 세션/캐시 가속 | 인프라 준비 (앱 연동은 후속) |
| **prometheus** | `prom/prometheus:v2.54.1` | 9090 | 메트릭 수집 | stub |
| **grafana** | `grafana/grafana:11.2.0` | 3000 | 대시보드 | stub |
| **tempo** | `grafana/tempo:2.6.0` | 3200 | 분산 추적 | stub |
| **loki** | `grafana/loki:3.2.0` | 3100 | 로그 수집 | stub |

> **stub 의미**: 기동·`healthy` 까지만 보장한다. Prometheus scrape target / Grafana dashboard·datasource / alert rule 등 **실제 관측 구성은 `spec-10-06`(auth-observability-dashboards)** 에서 추가한다.

## 기본값 / override

PostgreSQL 기본값은 `apps/api/.env` 와 일치하므로 **별도 설정 없이** 앱이 연결된다
(`postgres://postgres:postgres@localhost:5432/service_foundry_dev`).

포트/계정을 바꾸려면:

```bash
cp tooling/docker/env.example tooling/docker/.env
# .env 편집 후 다시 infra:up
```

override 가능 변수는 `env.example` 참고. compose 가 같은 디렉토리의 `.env` 를 자동 로드한다.

> 로컬에서 위 포트가 이미 점유돼 있으면 `up` 이 실패한다. 기존 서비스를 끄거나 `.env` 로 포트를 바꾼다.

## 검증

```bash
bash tooling/docker/smoke-test.sh
```

`compose config` → `up -d` → 전 서비스 `healthy` 폴링 → `pg_isready` / `redis ping` / 관측 4종 health 엔드포인트 검증 → `down -v`. 성공 시 exit 0.

옵션:
- `HEALTH_TIMEOUT=<초>` — 헬스 폴링 타임아웃 (기본 120)
- `KEEP_UP=1` — 실패 디버깅 시 down 생략
- 포트 점유 회피: `POSTGRES_PORT=15432 REDIS_PORT=16379 ... bash tooling/docker/smoke-test.sh`
