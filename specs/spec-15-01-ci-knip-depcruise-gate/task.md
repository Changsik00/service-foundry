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

- [ ] **task-07**: 위반 주입 검증 (시나리오 3)
  - unused export / frontend→backend import 주입 → red 확인 → 제거. 증거는 walkthrough 에.
  - 완료: 코드 변경 없음(검증만) — walkthrough 기록. (커밋 불요 시 [-] 스킵)

- [ ] **task-08**: factory tsconfig lib 불일치 정리 (작으면 동반)
  - `packages/shared/factory/tsconfig.json` 정합. 범위 크면 spec-15-05 로 이관([-]).
  - 완료: `chore(spec-15-01): align factory tsconfig lib`

## Ship
- [ ] walkthrough.md 작성
- [ ] pr_description.md 작성
- [ ] push + PR (base: `phase-15-security-wiring`)

## 진행 요약
| 항목 | 값 |
|---|---|
| 총 Task 수 | 8 (+ ship) |
| 현재 단계 | Planning |
| 마지막 업데이트 | 2026-06-01 |
