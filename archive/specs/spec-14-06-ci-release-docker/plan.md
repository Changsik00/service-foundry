# Implementation Plan: spec-14-06

## 📋 Branch Strategy
- 신규 브랜치: `spec-14-06-ci-release-docker`
- 시작 지점: `phase-14-quality-cicd`

## 🛑 사용자 검토 필요
> [!IMPORTANT]
> - [ ] release 는 **npm publish 안 함**(private) — changesets Version PR + docker(ghcr)만.
> - [ ] docker 이미지는 빌드 없이 **tsx 로 실행**(api/worker 에 build 파이프라인 없음).
> [!WARNING]
> - [ ] release.yml 자기 검증은 **머지 후 main 에서만** 가능(changesets action + ghcr). 본 PR 에선 docker build 로컬 + YAML 유효성으로 검증.

## 🎯 핵심 전략
| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| 실행 | `tsx src/main.ts`(watch 없음) | build 파이프라인 부재, tsx 직접 실행 |
| 이미지 | node:24-alpine + corepack pnpm, 루트 컨텍스트 | 모노레포 workspace 설치 필요 |
| docker 위치 | release(main)만 build/push | verify(매 PR) 부담 회피 |
| publish | ghcr.io (GITHUB_TOKEN) | 평문 시크릿 없음 |

## 📂 Proposed Changes

### Task 1 — prod start + Dockerfile (로컬 docker build 검증)
#### [MODIFY] `apps/api/package.json`, `apps/worker/package.json`
- `"start:prod": "tsx src/main.ts"` 추가.
#### [NEW] `apps/api/Dockerfile`, `apps/worker/Dockerfile`
```dockerfile
FROM node:24-alpine
RUN corepack enable
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
WORKDIR /app/apps/<svc>
EXPOSE 3000           # api 만
CMD ["pnpm", "run", "start:prod"]
```
> `.dockerignore`(루트) — node_modules/.git/dist 제외(컨텍스트 경량).
> 검증: `docker build -f apps/api/Dockerfile .` / worker 동일 → 성공 확인.

### Task 2 — release.yml
#### [NEW] `.github/workflows/release.yml`
```yaml
name: release
on: { push: { branches: [main] } }
permissions: { contents: write, pull-requests: write, packages: write }
jobs:
  version:   # changesets/action@v1 — "Version Packages" PR (publish 스크립트 없음)
  docker:    # docker/build-push-action → ghcr.io/<owner>/service-foundry-{api,worker}:{sha,latest}
```
> changesets action 의 `publish` 미지정(버전 PR 만). docker 는 login(ghcr) → build-push 2 이미지(matrix).

## 🧪 검증 계획
```bash
docker build -f apps/api/Dockerfile -t sf-api:test .      # 성공
docker build -f apps/worker/Dockerfile -t sf-worker:test .
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/release.yml'))"  # YAML(가능시)
pnpm turbo run typecheck   # verify 게이트 무변경 확인
```
+ 본 PR `verify` CI green. release.yml 동작은 머지 후 main 관측.

## 🔁 Rollback Plan
- Dockerfile/release.yml/start:prod 제거. 런타임 코드 무변경 → 영향 0.

## 📦 Deliverables 체크
- [ ] task.md / Plan Accept / 실행 / ship
