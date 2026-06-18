# refactor(spec-22-02): slim api/worker images via turbo prune + --prod

## 📋 Summary

### 배경 및 목적
spec-22-01 검증 중 api/worker 이미지가 monorepo 전체 설치로 비대(각 1.67GB)함을 발견. `turbo prune` 으로 앱별 의존성 부분집합만 추출하고 `pnpm install --prod` 로 devDep 을 제외해 런타임 이미지를 슬림화한다.

### 주요 변경 사항
- [x] api/worker Dockerfile: `turbo prune @apps/<app> --docker` → `pnpm install --prod --frozen-lockfile --shamefully-hoist` 멀티스테이지
- [x] tsx → api·worker deps, drizzle-kit·dotenv → api deps (--prod 생존 + migrate/config 필요)
- [x] migrate-job: drizzle-kit 바이너리 직접 실행 (slim 이미지의 pnpm catalog 우회)
- [x] **api 1.67GB→1.25GB(~25%), worker 1.67GB→512MB(~69%)**

### Phase 컨텍스트
- **Phase**: `phase-22` (Deploy) — base branch 모드, PR target `phase-22-deploy`
- **역할**: spec-22-01(k8s 샘플)이 띄우는 이미지를 운영 수준으로 슬림화.

## 🎯 Key Review Points

1. **prune vs deploy**: `pnpm deploy` 는 @repo/* 를 node_modules 로 옮겨 tsx 데코레이터 트랜스파일이 깨짐 → `turbo prune`(워크스페이스 심볼릭링크 보존) 채택. (walkthrough §발견 사항)
2. **--shamefully-hoist**: 워크스페이스 패키지가 hoisting 에 의존해 drizzle-orm 등을 import → fat 이미지 해석 동작 복원.
3. **런타임 deps 이동**: tsx/drizzle-kit/dotenv 를 deps 로 (--prod 생존). 단일 api 이미지가 런타임 + migrate Job 둘 다 담당.
4. **migrate-job command**: `pnpm run` → drizzle-kit 바이너리 직접 (catalog 미해석 회피).

## 🧪 Verification

### 자동
```bash
turbo run lint typecheck   # 96/96 PASS
```

### 통합 (로컬 kind)
```bash
bash tooling/k8s/verify.sh
```
- ✅ db-migrate Job 완료 → api/worker rollout
- ✅ api `/health/ready` → `{"status":"ready"}`
- ✅ worker `[worker] consumer started`

### 크기
| 이미지 | Before | After |
|---|---|---|
| api | 1.67GB | 1.25GB (~25%↓) |
| worker | 1.67GB | 512MB (~69%↓) |

## 📦 Files Changed
- `apps/api/Dockerfile`, `apps/worker/Dockerfile`: prune + --prod 멀티스테이지
- `apps/api/package.json`, `apps/worker/package.json`, `pnpm-lock.yaml`: 런타임 deps 이동
- `tooling/k8s/migrate-job.yaml`: drizzle-kit 직접 실행
- `.dockerignore`: `out` 추가
- `specs/spec-22-02-dockerfile-slim/*`

## ⚠️ 알려진 이슈 (별도 정리 → Icebox)
- `next`(~288MB)가 slim 이미지에 잔존: `@env-kit/node-settings@1.1.0` 이 `next` 를 직접 의존. 제거 시 추가 대폭 감소 가능.

## ✅ Definition of Done
- [x] api/worker Dockerfile 멀티스테이지 전환
- [x] 이미지 크기 감소 (api 25% / worker 69%)
- [x] `tooling/k8s/verify.sh` PASS (기능 동등성)
- [x] walkthrough / pr_description ship
- [x] lint / type check 통과

## 🔗 관련 자료
- Phase: `backlog/phase-22.md`
- Walkthrough: `specs/spec-22-02-dockerfile-slim/walkthrough.md`
