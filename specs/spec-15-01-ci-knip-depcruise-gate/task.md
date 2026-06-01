# Task List: spec-15-01

> One Task = One Commit. CI 게이트라 "테스트"는 게이트 명령 자체 실행으로 대체.

## Pre-flight
- [x] spec.md / plan.md / task.md 작성
- [x] phase.md SPEC 표 갱신
- [ ] 사용자 Plan Accept

## Tasks

- [ ] **task-01**: 브랜치 생성 + spec/plan/task 커밋
  - `git checkout -b spec-15-01-ci-knip-depcruise-gate` (phase base 에서)
  - 완료: `docs(spec-15-01): add spec/plan/task`

- [ ] **task-02**: knip config 교정 (오탐 제거)
  - root `knip.json` 작성 — entry/project/ignore 를 실제 워크스페이스에 맞춤. test 파일·catalog dep·devDep 오탐 정리.
  - 검증: `pnpm knip` 위반이 "진짜 dead 만" 남도록.
  - 완료: `build(spec-15-01): add root knip config (workspace-accurate)`

- [ ] **task-03**: 진짜 dead 처리 (제거 또는 ignore)
  - audit ⚪ 목록 각각 확인 → 제거 가능하면 제거, 의도적이면 knip ignore + 사유. (RolesGuard·needsRehash·createApiClient·createTracingSdk·tsup-config·node-app.json 등)
  - 검증: `pnpm knip` clean.
  - 완료: `refactor(spec-15-01): resolve real dead exports (remove or ignore)`

- [ ] **task-04**: depcruise root 배선
  - root `.dependency-cruiser.cjs` (preset require) + `pnpm depcruise` script.
  - 검증: `pnpm depcruise` 경계 위반 0.
  - 완료: `build(spec-15-01): wire dependency-cruiser at root`

- [ ] **task-05**: turbo task + root scripts
  - `turbo.json` 에 `knip`/`depcruise` task, `package.json` scripts.
  - 완료: `build(spec-15-01): add knip/depcruise turbo tasks + scripts`

- [ ] **task-06**: verify.yml 게이트 step
  - `.github/workflows/verify.yml` 에 knip + depcruise step 추가.
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
