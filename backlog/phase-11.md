# phase-11: CI / CD

> 보일러플레이트의 마지막 단계 — 반복 가능한 빌드 파이프라인 + 릴리스 자동화. 본래 phase-06 본문 이전.

## 📋 메타

| 항목 | 값 |
|---|---|
| **Phase ID** | `phase-11` |
| **상태** | Backlog |
| **시작일** | 미정 |
| **목표 종료일** | 미정 |
| **소유자** | dennis |
| **Base Branch** | 미정 |

## 🎯 배경 및 목표

### 현재 상황

phase-01~10이 끝나면 *로컬에서* 모든 acceptance 검증 가능. 그러나 PR 머지 게이트와 릴리스 워크플로가 자동화되지 않으면 *팀 또는 다중 머신 환경*에서 quality drift. docker publish + k8s manifest 예제가 있어야 service-foundry가 *진짜로* 운영 가능 보일러플레이트.

### 목표 (Goal)

GitHub Actions로 turbo affected lint/typecheck/test/build가 모든 PR에서 동작, changesets bot이 릴리스 PR 자동 생성, docker publish + (선택) k8s manifest 예제.

### 성공 기준 (Success Criteria) — 정량 우선

1. PR 생성 시 GitHub Actions가 `pnpm install --frozen-lockfile` + `turbo run lint typecheck test build` 그린 통과.
2. turbo affected가 변경 안 된 패키지를 skip해 PR CI 시간 절감.
3. main 머지 시 changesets bot이 "Version Packages" PR 자동 생성.
4. tagged release 시 docker image가 ghcr.io에 publish.
5. (선택) `tooling/k8s/` apps/api / apps/worker / postgres / redis sample manifest 동작 확인.

## 🧩 작업 단위 (SPECs)

<!-- sdd:specs:start -->
| ID | 슬러그 | 우선순위 | 상태 | 디렉토리 |
|---|---|:---:|---|---|
<!-- sdd:specs:end -->

### spec-11-01 — ci-github-actions

- **요점**: `.github/workflows/ci.yml` — `pnpm install --frozen-lockfile` + `turbo run lint typecheck test build` (affected).
- **방향성**: Node 22 LTS matrix 1개 시작. cache는 setup-node + turbo remote cache 평가.
- **연관 모듈**: `.github/workflows/`

### spec-11-02 — changesets-release-pr

- **요점**: changesets bot이 main 머지 후 "Version Packages" PR 자동 생성.
- **참조**: ADR-0002 §changesets. `.changeset/config.json`은 phase-01에서 작성됨.
- **연관 모듈**: `.github/workflows/release.yml`

### spec-11-03 — docker-publish

- **요점**: tagged release 시 apps/api / apps/worker / apps/web-* 이미지 ghcr.io publish.
- **방향성**: multi-stage Dockerfile per app + buildx + GHCR push.
- **연관 모듈**: `apps/*/Dockerfile` + `.github/workflows/docker.yml`

### spec-11-04 — k8s-manifest-example (선택)

- **요점**: `tooling/k8s/` apps/api / apps/worker / postgres / redis sample manifest.
- **방향성**: K8s manifest drift 검출은 backend/settings에서 이미 동작 — 본 spec은 *manifest 예제 자체* 제공.
- **연관 모듈**: `tooling/k8s/`

## 📌 결정 기록 (Review)

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| CI matrix | Node 22만 / Node 22 + 24 | 우선 22만 (engines.node 잠금) | ADR-0002 §3 — `>=22.0.0 <23` |
| turbo remote cache | 사용 / 미사용 | 우선 미사용 | 팀 사용 시점에 vercel/turbo 또는 self-hosted 결정 |
| docker registry | ghcr.io / docker hub | ghcr.io | github actions 통합 단순 |

## 🧪 통합 테스트 시나리오 (간결)

### 시나리오 1: PR CI 그린

- **Given**: spec-11-01 머지됨.
- **When**: 임의 PR 생성.
- **Then**: 모든 status check 그린 + turbo affected가 비변경 패키지 skip.

### 시나리오 2: release PR 자동 생성

- **Given**: spec-11-02 머지됨 + `.changeset/*.md` 포함된 PR이 main 머지됨.
- **When**: changesets bot 동작.
- **Then**: "Version Packages" PR 자동 생성 + 머지 시 changelog + version bump.

### 시나리오 3: docker publish

- **Given**: spec-11-03 머지됨.
- **When**: `git tag v0.1.0 && git push --tags`.
- **Then**: ghcr.io에 apps/* 이미지 publish.

## 🔗 의존성

- **선행 phase**: phase-09 (apps 코드) + phase-10 (tooling docker).
- **외부 시스템**: GitHub Actions, GHCR.
- **연관 ADR**: 0002 (changesets, pnpm)

## 🏁 Phase Done 조건

- [ ] 모든 SPEC(spec-11-01 ~ spec-11-03, 선택 spec-11-04) main에 merge
- [ ] 성공 기준 5개 충족
- [ ] 통합 테스트 3개 시나리오 PASS
- [ ] 사용자 최종 승인
