# Task List: spec-03-01

> 모든 task는 한 commit에 대응합니다 (One Task = One Commit).
> **Phase Base Branch 모드** — 첫 ship 시 `phase-03-backend-foundation` branch 자동 생성, 본 spec PR base = phase branch.

## Pre-flight

- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md / plan.md / task.md 작성
- [x] phase-03.md SPEC 표 자동 갱신
- [ ] 사용자 Plan Accept

---

## Task 1: 브랜치 생성

- [x] `git checkout -b spec-03-01-backend-settings`
- [x] Commit: 없음

---

## Task 2: catalog 추가 + 패키지 scaffold + `@env-kit/node-settings` API 정찰

- [x] `pnpm-workspace.yaml` catalog 추가:
  - `@env-kit/node-settings: ^1.0.2`
  - NestJS 6종: `@nestjs/common@11.1.21` / `@nestjs/config@4.0.4` / `@nestjs/core@11.1.21` / `@nestjs/testing@11.1.21` (devDep) / `reflect-metadata@0.2.2` / `rxjs@7.8.2`
  - `allowBuilds: @nestjs/core: true` 추가 (postinstall script)
- [x] `packages/backend/settings/` 디렉토리 + scaffold (package.json / tsconfig.json with experimentalDecorators+emitDecoratorMetadata / vitest.config.ts).
- [x] `pnpm install` → 22 패키지 추가, postinstall 정상.
- [x] `@env-kit/node-settings` API 정찰:
  - `defineSettings({ envSchema, envKey, defaults, perEnv, overrideEnvKey, build })` factory 패턴
  - `envSchema` (zod) / `envKey` (per-env 분기 키) / `defaults` (공통) / `perEnv` (env별 override) / `overrideEnvKey` (runtime JSON override) / `build` (최종 typed config builder)
  - `DEFAULT_SECRET_PATTERNS` (PASSWORD/TOKEN/SECRET → 자동 secret 분류)
  - K8s manifest / `.env.example` / Markdown docs 생성 — *별 export*에서 (정찰 후속 시점 확인)
- [x] **plan 수정**: 라이브러리가 이미 `defineSettings` 제공 → 본 패키지는 *얇은 NestJS adapter + BaseBackendSchema*만. spec 의도와 일관 (wrap pattern, 라이브러리 기능 그대로 활용).
- [x] `src/index.ts` placeholder (`export {}`).
- [x] typecheck → 통과.
- [x] Commit: `feat(spec-03-01): scaffold @repo/backend-settings + catalog deps (NestJS / @env-kit/node-settings)`

---

## Task 3: `defineSettings` helper + 첫 test

- [ ] `src/index.test.ts`: `describe("defineSettings")` 3 test:
  - 성공: valid env → typed config 반환
  - 실패: invalid env → AppError throw (code: "VALIDATION", details.errors)
  - source override: `defineSettings(schema, customEnv)` 동작
- [ ] test → Fail.
- [ ] `src/index.ts`: `defineSettings<T>(schema, source?): T` 구현. `@repo/errors` validationError 사용.
- [ ] test → Pass.
- [ ] Commit: `feat(spec-03-01): add defineSettings helper with @repo/errors integration`

---

## Task 4: `BaseBackendSchema` + test

- [ ] `src/index.test.ts`: `describe("BaseBackendSchema")` 2 test:
  - 모든 default 적용 (`NODE_ENV: "test"` 만으로 PORT/LOG_LEVEL 기본값)
  - 잘못된 NODE_ENV 거부
- [ ] test → Fail.
- [ ] `src/index.ts`: `BaseBackendSchema` 정의 (NODE_ENV / PORT / LOG_LEVEL).
- [ ] test → Pass.
- [ ] Commit: `feat(spec-03-01): add BaseBackendSchema (NODE_ENV / PORT / LOG_LEVEL)`

---

## Task 5: `BackendSettingsModule` NestJS adapter + test

- [ ] `src/index.test.ts`: `describe("BackendSettingsModule")` 2 test:
  - `forRoot(schema)` 호출 시 DynamicModule 객체 구조 (module / providers / exports / global)
  - BACKEND_SETTINGS provider value가 *defineSettings 결과*와 일치
- [ ] test → Fail.
- [ ] `src/index.ts`: `BACKEND_SETTINGS` symbol + `BackendSettingsModule.forRoot<T>(schema)` 구현.
- [ ] test → Pass.
- [ ] Commit: `feat(spec-03-01): add BackendSettingsModule NestJS adapter`

---

## Task 6: dogfooding test — `.env.example` 생성

- [ ] `src/index.test.ts`: `describe("dogfooding")` 1 test:
  - sample schema 정의
  - `@env-kit/node-settings` CLI 또는 API로 `.env.example` 문자열 생성
  - 출력에 정의된 모든 env key 포함 확인
- [ ] test → 실제 `@env-kit/node-settings` API에 따라 구현 (T2 정찰 결과 따름).
- [ ] test → Pass.
- [ ] Commit: `test(spec-03-01): dogfooding .env.example generation`

---

## Task 7: Ship (필수)

- [ ] `pnpm lint` + `pnpm typecheck` + `pnpm test` 그린.
- [ ] `bash .harness-kit/bin/sdd test passed`.
- [ ] **walkthrough.md 작성** (결정 + `@env-kit/node-settings` 정찰 결과 + Phase Base Branch 첫 spec 동작 검증 + 발견 사항).
- [ ] **pr_description.md 작성**.
- [ ] `sdd ship --check` 통과.
- [ ] **Ship Commit**: sdd ship 자동.
- [ ] **Push**: `git push -u origin spec-03-01-backend-settings`.
- [ ] **PR 생성**: `gh pr create --base phase-03-backend-foundation` (Phase base branch — 첫 ship 시 자동 생성됨).
- [ ] **사용자 알림**.

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 7 (T1 브랜치 + T2 scaffold+정찰 + T3 defineSettings + T4 BaseSchema + T5 NestJS adapter + T6 dogfooding + T7 ship) |
| **예상 commit 수** | 6 (T1 commit 없음) |
| **예상 test 수** | ~8 (defineSettings 3 + BaseBackendSchema 2 + BackendSettingsModule 2 + dogfooding 1) |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-05-18 |
