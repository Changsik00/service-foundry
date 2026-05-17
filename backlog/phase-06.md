# phase-06: CI / CD

> 보일러플레이트의 마지막 단계 — *반복 가능한 빌드 파이프라인*과 *릴리스 자동화*.
> 이 phase가 끝나면 PR 단위로 turbo affected 빌드/테스트가 돌고, changesets 기반 릴리스 PR이 자동 생성된다.

## 📋 메타

| 항목 | 값 |
|---|---|
| **Phase ID** | `phase-06` |
| **상태** | Backlog |
| **시작일** | 미정 |
| **목표 종료일** | 미정 |
| **소유자** | dennis |
| **Base Branch** | 미정 |

## 🎯 배경 및 목표

### 현재 상황

Phase 1~5가 끝나면 *로컬에서* 모든 acceptance를 검증할 수 있다. 그러나 PR 머지 게이트와 릴리스 워크플로가 자동화되어 있지 않으면 *팀 또는 다중 머신 환경*에서 quality drift가 발생한다. 또한 docker publish + k8s manifest 예제가 있어야 service-foundry가 *진짜로* 운영 가능 보일러플레이트라고 말할 수 있다.

### 목표 (Goal)

GitHub Actions로 turbo affected lint/typecheck/test/build가 모든 PR에서 돌고, changesets bot이 릴리스 PR 자동 생성, docker publish + (선택) k8s manifest 예제까지 완성.

### 성공 기준 (Success Criteria) — 정량 우선

1. PR 생성 시 GitHub Actions가 `pnpm install --frozen-lockfile` + `turbo run lint typecheck test build` 그린 통과.
2. turbo affected가 변경 안 된 패키지를 skip해 PR CI 시간이 절감됨.
3. main 머지 시 changesets bot이 "Version Packages" PR 자동 생성.
4. tagged release 시 docker image가 ghcr.io에 publish.
5. (선택) `tooling/k8s/` 디렉토리에 apps/api / apps/worker / postgres / redis sample manifest 동작 확인.

## 🧩 작업 단위 (SPECs)

<!-- sdd:specs:start -->
| ID | 슬러그 | 우선순위 | 상태 | 디렉토리 |
|---|---|:---:|---|---|
<!-- sdd:specs:end -->

> 상태 허용값: `Backlog` / `In Progress` / `Merged`

### spec-06-01 — ci-github-actions

- **요점**: `.github/workflows/ci.yml` — `pnpm install --frozen-lockfile` + `turbo run lint typecheck test build` (affected).
- **방향성**: Node 22 LTS matrix 1개로 시작. cache는 `actions/setup-node` + turbo remote cache 평가.
- **연관 모듈**: `.github/workflows/`

### spec-06-02 — changesets-release-pr

- **요점**: changesets bot이 main 머지 후 "Version Packages" PR 자동 생성.
- **방향성**: ADR-0002 §changesets 결정 따름. `.changeset/config.json`은 Phase 1에 이미 작성됨 — bot 설정만 추가.
- **연관 모듈**: `.github/workflows/release.yml`

### spec-06-03 — docker-publish

- **요점**: tagged release 시 apps/api / apps/worker / apps/web-* 이미지 ghcr.io publish.
- **방향성**: multi-stage Dockerfile per app + buildx + GHCR push. tooling/docker는 *로컬 인프라*용이고 본 spec은 *서비스 이미지*용으로 별개.
- **연관 모듈**: `apps/*/Dockerfile` + `.github/workflows/docker.yml`

### spec-06-04 — k8s-manifest-example (선택)

- **요점**: `tooling/k8s/` apps/api / apps/worker / postgres / redis sample manifest.
- **방향성**: service-foundry의 차별화 포인트 "K8s manifest drift 검출"이 backend/settings로 이미 동작 — 본 spec은 *manifest 예제 자체* 제공.
- **연관 모듈**: `tooling/k8s/`

## 📌 결정 기록 (Review)

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| CI matrix | Node 22만 / Node 22 + 24 | 우선 22만 (engines.node 잠금) | ADR-0002 §3 — `>=22.0.0 <23`. 24 지원은 별 spec |
| turbo remote cache | 사용 / 미사용 | 우선 미사용 (개인 보일러플레이트) | 팀 사용 시점에 vercel/turbo 또는 self-hosted cache 결정 |
| docker registry | ghcr.io / docker hub | ghcr.io | github actions 통합 단순 |

## 🧪 통합 테스트 시나리오 (간결)

### 시나리오 1: PR CI 그린

- **Given**: spec-06-01 머지됨.
- **When**: 임의 PR 생성.
- **Then**: 모든 status check 그린 + turbo affected가 비변경 패키지 skip.
- **연관 SPEC**: spec-06-01

### 시나리오 2: release PR 자동 생성

- **Given**: spec-06-02 머지됨 + 변경에 `.changeset/*.md` 포함된 PR이 main 머지됨.
- **When**: changesets bot 동작 대기.
- **Then**: "Version Packages" PR이 자동 생성, 본 PR 머지 시 changelog + version bump.
- **연관 SPEC**: spec-06-02

### 시나리오 3: docker publish

- **Given**: spec-06-03 머지됨.
- **When**: `git tag v0.1.0 && git push --tags`.
- **Then**: ghcr.io에 apps/* 이미지 publish.
- **연관 SPEC**: spec-06-03

### 통합 테스트 실행

- 본 phase는 GitHub Actions 환경에서 실행 — 로컬 통합 테스트는 `act` 도구 사용 가능하나 필수 아님.

## 🔗 의존성

- **선행 phase**: phase-04 (apps 코드) + phase-05 (tooling docker, 로컬 검증).
- **외부 시스템**: GitHub Actions, GHCR.
- **연관 ADR**:
  - `docs/adr/0002-monorepo-foundations.md` (changesets, pnpm)

## 📝 위험 요소 및 완화

| 위험 | 영향 | 완화책 |
|---|---|---|
| turbo affected가 false negative (변경된 패키지를 skip) | 빌드 미검출 회귀 | release 직전 `--force` 또는 main 머지 직후 full build 한 번 더 |
| changesets bot의 PR이 너무 자주 생성 | 노이즈 | branch protection으로 changeset이 없는 PR 차단 안 함 — 사용자 선택 |
| docker image 사이즈 비대화 | publish/pull 시간 | multi-stage build + distroless base 평가 |

## 🏁 Phase Done 조건

- [ ] 모든 SPEC(spec-06-01 ~ spec-06-03, 선택 spec-06-04) main에 merge
- [ ] 성공 기준 5개 충족
- [ ] 통합 테스트 3개 시나리오 PASS
- [ ] 사용자 최종 승인

## 📊 검증 결과 (phase 완료 시 작성)

<!-- 통합 테스트 로그, 성공 기준 측정값, 회귀 점검 결과 등을 여기 첨부 -->
