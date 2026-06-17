# Task List: spec-22-02

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).

> ✅ **완료** (2026-06-17) — 최종 방식: `turbo prune + pnpm install --prod --shamefully-hoist`.
> (초기 `pnpm deploy` 는 @repo/* 를 node_modules 로 옮겨 tsx 데코레이터 트랜스파일이 깨져 폐기.)
> 결과: **api 1.67GB→1.25GB(~25%), worker 1.67GB→512MB(~69%)**. k8s verify.sh PASS (api /health/ready 200 + worker 기동).
> `next` 는 `@env-kit/node-settings` 직접 의존으로 잔존(별도 정리, Icebox).

---

## Task 0: 브랜치 생성
- [x] `git checkout -b spec-22-02-dockerfile-slim` (base: phase-22-deploy)

## Task 1: 런타임 deps 이동
- [x] tsx → api·worker deps, drizzle-kit → api deps (migrate Job 도 api 이미지 사용)
- [x] dotenv → api deps (drizzle.config 가 import) + lockfile
- [x] Commit

## Task 2: api/worker Dockerfile 멀티스테이지
- [x] `turbo prune @apps/<app> --docker` → `pnpm install --prod --frozen-lockfile --shamefully-hoist` → 워크스페이스 구조 보존
- [x] root tsconfig(데코레이터) runner 복사, CMD tsx 바이너리 직접 실행(pnpm 우회), EXPOSE 2026 정정
- [x] Commit

## Task 3: migrate-job 수정
- [x] `tooling/k8s/migrate-job.yaml` command → drizzle-kit 바이너리 직접 (pnpm catalog 우회)
- [x] Commit

## Task 4: 빌드·통합 검증
- [x] `docker build` 성공 + 크기 측정: api 1.25GB, worker 512MB (원본 1.67GB)
- [x] `bash tooling/k8s/verify.sh` PASS — migrate 완료 → api `/health/ready` 200 + worker `consumer started`
- [x] devDep(biome/turbo) 부재, tsx·drizzle-kit·dotenv·drizzle-orm hoist 확인

## Task 5: Ship
### 🚦 Pre-Push Quality Gate
- [x] `turbo run lint typecheck` PASS
### 📝 산출물
- [x] walkthrough.md / pr_description.md 작성
- [x] Commit
### 🚀 Push & PR
- [x] push + PR #156 (draft → ready), base `phase-22-deploy`
