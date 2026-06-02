# feat(spec-10-01): 로컬 인프라 docker-compose 스택

## 📋 Summary

### 배경 및 목적

phase-09까지 `apps/api`/`web-next`/`web-vite` 가 부트 가능하나, 의존 인프라(Postgres/Redis/관측)는 수동 기동이었다. 본 spec 은 `docker compose -f tooling/docker/compose.yaml up` **한 줄**로 전체 인프라를 띄워 온보딩 비용과 환경 편차를 제거하고, phase-10 후속 spec(특히 spec-10-06 관측)의 기반을 마련한다.

### 주요 변경 사항
- [x] `tooling/docker/compose.yaml` 신설 — postgres + redis + prometheus + grafana + tempo + loki (6종, 전부 healthcheck + 이미지 pin)
- [x] postgres/redis 는 코어로 앱 연결까지 완성 (기본값을 `apps/api/.env` 와 일치 → 앱 코드 무변경)
- [x] 관측 4종은 "기동·healthy" stub — scrape/dashboard/alert 는 spec-10-06 으로 분리
- [x] `pnpm infra:up` / `infra:down` / `infra:logs` 스크립트 + `tooling/docker/README.md`
- [x] `tooling/docker/smoke-test.sh` 통합 스모크 테스트 (up → health → 기능검증 → down)

### Phase 컨텍스트
- **Phase**: `phase-10` (Ops & Tooling)
- **본 SPEC 의 역할**: 성공 기준 1번(한 줄 인프라 부트) 충족 + 통합 테스트 시나리오 1 의 기반 제공

## 🎯 Key Review Points

1. **postgres 기본값 일치**: `${POSTGRES_*:-...}` 기본값이 `apps/api/.env` 와 정확히 일치 — 앱 무변경 연결이 핵심.
2. **stub 경계**: 관측 4종은 의도적으로 최소 config. 실제 관측 구성은 spec-10-06 (README/walkthrough 에 명시).
3. **smoke-test.sh**: 내부 `compose exec` 기반 검증이라 호스트 발행 포트와 무관 — 포트 충돌 환경에서도 기능 검증 가능.

## 🧪 Verification

### 자동 테스트 (compose 스키마)
```bash
docker compose -f tooling/docker/compose.yaml config --quiet
```
**결과**: ✅ 통과 (6 services)

### 통합 테스트
```bash
bash tooling/docker/smoke-test.sh
```
**결과**: ✅ 전 서비스 healthy + pg_isready / redis PONG / prometheus·grafana·tempo·loki health 통과

### 수동 검증 시나리오
1. `pnpm infra:up` → `docker compose ps` 6 서비스 running → 통과
2. `pg_isready` / `redis-cli ping` → `accepting connections` / `PONG`

## 📦 Files Changed

### 🆕 New Files
- `tooling/docker/compose.yaml`: 6종 인프라 서비스 정의
- `tooling/docker/env.example`: override 변수 템플릿
- `tooling/docker/smoke-test.sh`: 통합 스모크 테스트
- `tooling/docker/README.md`: 사용법 + 포트 표 + 경계
- `tooling/docker/observability/{prometheus.yml,tempo.yaml,loki.yaml}`: 관측 stub 최소 config

### 🛠 Modified Files
- `package.json` (+3): `infra:up/down/logs` 스크립트

**Total**: 8 files changed (+390)

## ✅ Definition of Done

- [x] 단위 테스트(compose config) 통과
- [x] 통합 테스트(smoke-test) 통과
- [x] `walkthrough.md` / `pr_description.md` ship commit
- [x] lint(biome) 통과
- [x] 사용자 검토 요청 알림 완료

## 🔗 관련 자료

- Phase: `backlog/phase-10.md`
- Walkthrough: `specs/spec-10-01-tooling-docker/walkthrough.md`
- 후속 spec: `spec-10-06` (auth-observability-dashboards)
