# Task List: spec-15-01

> One Task = One Commit. CI 게이트라 "테스트"는 게이트 명령 자체 실행으로 대체.

## Pre-flight
- [x] spec.md / plan.md / task.md 작성
- [x] phase.md SPEC 표 갱신
- [x] 사용자 Plan Accept

## Tasks

- [x] **task-01**: 브랜치 생성 + spec/plan/task 커밋
  - `git checkout -b spec-15-01-ci-knip-depcruise-gate` (phase base 에서)
  - 완료: `docs(spec-15-01): add spec/plan/task` (e36bd4c)

- [x] **task-02**: knip config 교정 (오탐 제거)
  - knip 6 은 config `extends` 미지원 → root `knip.config.ts` 가 `@repo/knip-config/base` JSON 을 re-export (preset = SoT). base.json 을 실측 워크스페이스에 맞게 재작성: test entry(plugin 보조)·tooling `ignoreDependencies`(biome-config/turbo-gen/tsup/drizzle-kit/tailwindcss/nestjs)·`rules`(duplicates off, catalog warn). README 도 extends→re-export 로 교정.
  - 검증: `pnpm knip` 오탐 0, "진짜 항목"(scaffolding export 2개)만 남음 → task-03 에서 해소.
  - 완료: `build(spec-15-01): add root knip config (workspace-accurate)`

- [x] **task-03**: 진짜 dead 처리 (사용자 결정: 전부 보존)
  - 미사용 workspace deps(7)·sample export 는 보일러플레이트 YAGNI-면제 scaffolding → 삭제 없이 보존: deps 는 워크스페이스별 `ignoreDependencies`(예 apps/api `@repo/backend-auth-rate-limit` = 15-02~04 배선예정), 의도적 export/type 은 소스에 `@public` JSDoc 태그(`InjectOAuthAccountStore`·`AuditLogInsert`). turbo generators·TanStack route·drizzle schema barrel 등 framework 오탐은 entry 로 해소.
  - 검증: `pnpm knip` exit 0 (catalog 1건 warn=비차단).
  - 완료: `refactor(spec-15-01): preserve scaffolding via knip @public tags`

- [x] **task-04**: depcruise root 배선
  - root `.dependency-cruiser.cjs` (preset require) + `pnpm depcruise` script.
  - 검증: `pnpm depcruise` 경계 위반 0 (383 modules, 825 deps, exit 0).
  - 완료: `build(spec-15-01): wire dependency-cruiser at root`

- [x] **task-05**: turbo task + root scripts
  - `turbo.json` 에 root task `//#knip`·`//#depcruise` (전역 분석기라 per-package 아님, 소스 전체 input 으로 stale-pass 방지), `package.json` 에 `knip` script.
  - 부수: depcruise 배선 후 redundant 해진 tooling ignore 3개(@repo/depcruise-config·dependency-cruiser·@turbo/gen) 제거 — knip depcruise plugin·turbo entry 가 추적.
  - 검증: `pnpm turbo run knip depcruise` 2 successful, exit 0.
  - 완료: `build(spec-15-01): add knip/depcruise turbo tasks + scripts`

- [x] **task-06**: verify.yml 게이트 step
  - `.github/workflows/verify.yml` install 직후 `pnpm turbo run knip depcruise` step 추가 (DB·build 불필요 → test 앞 fail-fast).
  - 완료: `ci(spec-15-01): add knip + depcruise to verify gate`

- [x] **task-07**: 위반 주입 검증 (시나리오) — 검증 전용, 커밋 없음
  - 시나리오1: `__knipCanary` 미사용 export 주입 → `pnpm knip` exit 1 (red) 확인 → 복원, exit 0.
  - 시나리오2: frontend/ui 에 backend 상대 import 주입 → `pnpm depcruise` `frontend-no-backend-imports` error, exit 1 (red) 확인 → 삭제, exit 0.
  - 증거: walkthrough 기록.

- [-] **task-08**: factory tsconfig lib 불일치 — spec-15-05 이관
  - `packages/shared/factory/tsconfig.json` 은 `@repo/typescript-config/base` extends 최소 설정, `lib` 필드 없음, `pnpm --filter @repo/factory typecheck` 통과 → 패키지 자체엔 실제 불일치 없음.
  - 플랜이 가리킨 "lib 불일치"는 factory 가 **생성하는** 템플릿 tsconfig 쪽 → spec-15-05(생성기 tsconfig, 본 spec out-of-scope) 에서 처리. (queue 신규 항목 불요 — 이미 phase-15 계획에 존재)

## Ship
- [x] walkthrough.md 작성
- [x] pr_description.md 작성
- [ ] push + PR (base: `phase-15-security-wiring`)

## 진행 요약
| 항목 | 값 |
|---|---|
| 총 Task 수 | 8 (task-08 [-] 이관, + ship) |
| 현재 단계 | Ship |
| 마지막 업데이트 | 2026-06-01 |
