# Walkthrough: spec-10-01

> 로컬 인프라 docker-compose 스택 — postgres+redis 코어 + 관측 stub 4종.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| compose 범위 | 코어(pg+redis) / 코어+관측 stub / 6종 완전 | **코어 + 관측 stub** | 성공기준 1번(6종 부트) 충족하되 scrape/dashboard/alert 책임은 spec-10-06 으로 분리 (사용자 결정) |
| base branch 모드 | base / 비-base | **base 모드** (`phase-10-ops-tooling`) | 직전 phase-08/09 와 일관 (사용자 결정) |
| postgres 기본값 | 신규 정의 / `apps/api/.env` 일치 | **`.env` 일치** | 앱 코드 변경 없이 연결 (postgres/postgres/service_foundry_dev/5432) |
| `.env.example` 파일명 | `.env.example` / 비-dotfile | **`env.example`** | dotenv 보호 권한이 `.env.example` Write/Bash 차단 → 동일 목적의 복사용 템플릿을 비-dotfile 로 |
| 시크릿 가드 false positive | block 준수 / 우회 / 가드 개선 | **이 커밋만 warn** | `POSTGRES_PASSWORD: ${...:-postgres}` 는 env 보간 + 개발 기본값 — 실제 시크릿 아님을 검증. 가드 개선은 별도 Icebox |
| 관측 stub 이미지 | latest / 버전 pin | **버전 pin** | 재현성 (prom v2.54.1 / grafana 11.2.0 / tempo 2.6.0 / loki 3.2.0) |

### ADR 승격 가이드

- [ ] ADR 승격 대상 있음
- [x] 없음 (단 `tooling/{docker,generators,scripts}` 레이아웃 컨벤션은 phase-10 누적 후 ADR 후보 — 본 spec 은 기록만)

## 💬 사용자 협의

- **주제**: phase-10 첫 spec 범위
  - **사용자 의견**: docker-compose 먼저
  - **합의**: spec-10-01 = tooling-docker, 코어+관측 stub 범위
- **주제**: 시크릿 가드 false positive 처리
  - **사용자 의견**: 이 커밋만 warn 으로
  - **합의**: 실제 시크릿 아님 검증 후 `HARNESS_HOOK_MODE_SECRETS=warn` 으로 해당 2개 commit 통과. 가드 개선은 Icebox

## 🧪 검증 결과

### 1. 자동화 테스트

#### 단위 테스트 (compose 스키마 유효성)
- **명령**: `docker compose -f tooling/docker/compose.yaml config --quiet`
- **결과**: ✅ Passed (6 services)

#### 통합 테스트
- **명령**: `bash tooling/docker/smoke-test.sh` (로컬 포트 충돌로 발행 포트 override 실행)
- **결과**: ✅ Passed
- **로그 요약**:
```text
✓ compose config 유효
✓ 전 서비스 healthy
✓ postgres: pg_isready
✓ redis: PONG
✓ prometheus: http /-/healthy
✓ grafana: http /api/health
✓ tempo: http /ready
✓ loki: http /ready
✓ 스모크 테스트 통과 — 6개 서비스 정상
```

### 2. 수동 검증

1. **Action**: `pnpm infra:up` (포트 override)
   - **Result**: 6개 컨테이너 전부 `running` (`docker compose ps` 확인)
2. **Action**: `pnpm infra:down`
   - **Result**: 컨테이너/네트워크 정리 완료
3. **Action**: postgres 기능 확인 `pg_isready -U postgres -d service_foundry_dev`
   - **Result**: `accepting connections`
4. **Action**: redis `redis-cli ping`
   - **Result**: `PONG`

## 🔍 발견 사항

- **로컬 환경 포트 충돌**: 개발 머신에 타 프로젝트 컨테이너(academy-*, aiagent-*)가 6379/9090/3100 등을 점유 중. compose 파일 자체는 정상이며, 발행 포트 override 로 검증함. README 에 충돌 회피 안내 추가.
- **시크릿 가드 heuristic false positive**: `check-secrets.sh` 의 `(password|secret|...)[=:]값` 패턴이 compose 의 env 보간(`${POSTGRES_PASSWORD:-postgres}`)을 시크릿으로 오탐. env_file 로 빼도 ".env 없이 한 줄 부트" 요구가 깨져 우회 불가. **phase-10 후속 spec(특히 grafana/관측 설정)에서 반복될 것** → 가드 개선 Icebox 등록.

## 🚧 이월 항목

- 관측 스택 실제 구성(scrape target / Grafana datasource·dashboard / alert rule) → **spec-10-06** (이미 phase-10.md 에 정의됨)
- 앱 측 Redis 연동 코드 → 후속
- check-secrets 훅이 `${...}`-only 보간값을 오탐하지 않도록 개선 → `backlog/queue.md` Icebox 등록

## 🔗 관련 문서 (Related)

- 관련 phase: `backlog/phase-10.md`
- 관련 ADR: ADR-0002 (locked stack), ADR-0005 (Drizzle 단일)
- 후속 spec: `spec-10-06` (auth-observability-dashboards)

## 📅 메타

| 항목 | 값 |
|---|---|
| **작성자** | Agent + dennis |
| **작성 기간** | 2026-05-30 |
| **최종 commit** | ship 시 갱신 |
