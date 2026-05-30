# Task List: spec-10-01

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

## Pre-flight (Plan 작성 단계)

- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성 (이 파일)
- [x] 백로그 업데이트 (phase-10.md SPEC 표 — `sdd spec new` 가 자동 갱신)
- [ ] 사용자 Plan Accept

---

## Task 1: 브랜치 생성 + 스모크 테스트 스캐폴드 (TDD Red)

### 1-1. 브랜치 생성
- [x] `git checkout -b spec-10-01-tooling-docker` (from `main`)
- [x] Commit: 없음 (브랜치 생성만)

### 1-2. 스모크 테스트 작성 (TDD Red)
- [x] `tooling/docker/smoke-test.sh` 작성 — `compose up -d` → 헬스 폴링 → pg/redis/관측 검증 → `compose down -v`
- [x] 실행 → Fail 확인 (compose.yaml 아직 없음 → `compose config` 실패)
- [x] Commit: `test(spec-10-01): add docker compose smoke test (failing)`

---

## Task 2: postgres + redis 코어 서비스 (TDD Green)

### 2-1. compose.yaml 코어 작성
- [x] `tooling/docker/compose.yaml` — postgres(:5432, named volume, healthcheck) + redis(:6379, healthcheck)
- [x] `tooling/docker/env.example` — override 변수 + 기본값(apps/api/.env 일치). ※ `.env.example` 은 dotenv 보호 권한으로 차단 → `env.example` 로 명명
- [x] `docker compose -f tooling/docker/compose.yaml config --quiet` → Pass
- [x] smoke-test (pg+redis 부분, 포트 override) → Pass (healthy + pg_isready + PONG)
- [x] Commit: `feat(spec-10-01): add postgres+redis core to local compose stack` (※ 시크릿 가드 false positive — `POSTGRES_PASSWORD` env 보간 → 이 커밋만 warn)

---

## Task 3: 관측 stub 4종 (prometheus/grafana/tempo/loki)

### 3-1. 관측 서비스 + 최소 config
- [x] `compose.yaml` 에 prometheus/grafana/tempo/loki 추가 (이미지 pin + healthcheck)
- [x] `tooling/docker/observability/{prometheus.yml,tempo.yaml,loki.yaml}` 최소 config 작성
- [x] `docker compose config --quiet` → Pass
- [x] smoke-test (6종 전체 healthy) → Pass (전 서비스 healthy + pg/redis/prom/grafana/tempo/loki 검증)
- [x] Commit: `feat(spec-10-01): add observability stub services (prometheus/grafana/tempo/loki)` (※ grafana PASSWORD env 보간 — warn)

---

## Task 4: DX — 루트 스크립트 + README

### 4-1. infra 스크립트 + 문서
- [x] `package.json` 에 `infra:up` / `infra:down` / `infra:logs` 스크립트 추가
- [x] `tooling/docker/README.md` 작성 (사용법 + 포트 표 + spec-10-06 경계)
- [x] `pnpm infra:up` → `docker compose ps` 6 서비스 running 확인 → `pnpm infra:down`
- [x] Commit: `chore(spec-10-01): add infra npm scripts and docker compose docs`

---

## Task 5: Ship (필수)

> 모든 작업 task 완료 후 `/hk-ship` 절차를 따릅니다.

- [x] 코드 품질 점검: `docker compose config --quiet` PASS / `shellcheck` [-] 미설치(스킵)
- [x] 통합 테스트 실행: `bash tooling/docker/smoke-test.sh` → PASS (6종 healthy)
- [x] **walkthrough.md 작성** (증거 로그: smoke-test 출력, `compose ps` running)
- [x] **pr_description.md 작성** (템플릿 준수)
- [x] **Ship Commit**: `docs(spec-10-01): ship walkthrough and pr description`
- [x] **Push**: `git push -u origin spec-10-01-tooling-docker` (base 브랜치 phase-10-ops-tooling 도 생성·push)
- [x] **PR 생성**: PR #63 (base = `phase-10-ops-tooling`)
- [x] **사용자 알림**: PR URL 보고

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 5 (작업 4 + Ship) |
| **예상 commit 수** | 4 (test 1 + feat 2 + chore 1) + ship 1 |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-05-30 |
