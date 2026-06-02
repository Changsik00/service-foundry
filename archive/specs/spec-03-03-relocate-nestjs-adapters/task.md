# Task List: spec-03-03

> 모든 task는 한 commit에 대응합니다 (One Task = One Commit).
> **Phase Base Branch 모드** — PR base = `phase-03-backend-foundation`.
> 본 spec은 *재배치 + rename* (코드 동작 변경 0). ADR-0015 적용 + spec-03-01 정정.

## Pre-flight

- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md / plan.md / task.md 작성
- [x] phase-03.md SPEC 표 자동 갱신
- [ ] 사용자 Plan Accept

---

## Task 1: 브랜치 생성

- [ ] `git checkout -b spec-03-03-relocate-nestjs-adapters` (시작 지점: `phase-03-backend-foundation`)
- [ ] Commit: 없음

---

## Task 2: `logger-nestjs` 이동 + rename

- [ ] `mkdir -p packages/nestjs`
- [ ] `git mv packages/backend/logger-nestjs packages/nestjs/logger`
- [ ] `packages/nestjs/logger/package.json` 의 `name`: `@repo/backend-logger-nestjs` → `@repo/nestjs-logger`
- [ ] 전체 grep — use sites 갱신:
  - `grep -rn "@repo/backend-logger-nestjs" --include='*.ts' --include='*.tsx' --include='*.json' .` → 일괄 치환
- [ ] `pnpm install` → lockfile 갱신
- [ ] `pnpm --filter @repo/nestjs-logger typecheck` → 통과
- [ ] `pnpm --filter @repo/nestjs-logger test` → 4 test 그린
- [ ] Commit: `refactor(spec-03-03): relocate backend-logger-nestjs to nestjs/logger (ADR-0015)`

---

## Task 3: `backend-settings` 에서 NestJS 제거

- [ ] `packages/backend/settings/src/index.ts`: `BACKEND_SETTINGS` symbol + `BackendSettingsModule` 제거
- [ ] `packages/backend/settings/src/index.test.ts`: `describe("BackendSettingsModule")` 2 test 제거
- [ ] `packages/backend/settings/package.json` deps 정리:
  - `dependencies`: `@nestjs/common` / `rxjs` / `reflect-metadata` (사용 검증 후) 제거
  - `devDependencies`: `@nestjs/core` / `@nestjs/testing` 제거
- [ ] `packages/backend/settings/tsconfig.json`: `experimentalDecorators` / `emitDecoratorMetadata` 제거
- [ ] `pnpm install` → lockfile 갱신
- [ ] `pnpm --filter @repo/backend-settings typecheck` → 통과
- [ ] `pnpm --filter @repo/backend-settings test` → 6 test 그린 (8 → 6)
- [ ] `grep -rn "@nestjs\|BACKEND_SETTINGS\|BackendSettingsModule" packages/backend/settings/` → 0 hit
- [ ] Commit: `refactor(spec-03-03): remove NestJS code from @repo/backend-settings (ADR-0015)`

---

## Task 4: `nestjs/settings` 신규 패키지

- [ ] `mkdir -p packages/nestjs/settings/src`
- [ ] `packages/nestjs/settings/package.json` 작성 (deps: @nestjs/common + @repo/backend-settings workspace + reflect-metadata, devDeps: 표준 + @nestjs/core/testing + rxjs)
- [ ] `packages/nestjs/settings/tsconfig.json` 작성 (decorators + node types)
- [ ] `packages/nestjs/settings/vitest.config.ts` 작성
- [ ] `packages/nestjs/settings/src/index.ts`: `BACKEND_SETTINGS` symbol + `BackendSettingsModule.forRoot()` 이동 (generic loader 시그니처 보존)
- [ ] `packages/nestjs/settings/src/index.test.ts`: T3에서 제거한 test 2개 이동
- [ ] `pnpm install` → lockfile 갱신
- [ ] `pnpm --filter @repo/nestjs-settings typecheck` → 통과
- [ ] `pnpm --filter @repo/nestjs-settings test` → 2 test 그린
- [ ] Commit: `feat(spec-03-03): add @repo/nestjs-settings adapter package (ADR-0015)`

---

## Task 5: 전체 검증 + depcruise

- [ ] `pnpm lint` 그린
- [ ] `pnpm typecheck` 그린
- [ ] `pnpm test` 그린 (19 test: backend-logger 7 + nestjs-logger 4 + backend-settings 6 + nestjs-settings 2)
- [ ] `pnpm exec depcruise --config packages/config/depcruise-config/base.cjs packages/` → 0 violations (41 modules / 53 deps)
- [ ] Commit: 없음 (검증만)

---

## Task 6: Ship (필수)

- [ ] `bash .harness-kit/bin/sdd test passed`
- [ ] **walkthrough.md 작성** (결정 + 발견 사항 + before/after 비교)
- [ ] **pr_description.md 작성** (10 Key Review Points + 검증 결과)
- [ ] `sdd ship --check` 통과
- [ ] **Ship Commit**: sdd ship 자동
- [ ] **Push**: `git push -u origin spec-03-03-relocate-nestjs-adapters`
- [ ] **PR 생성**: `gh pr create --base phase-03-backend-foundation`
- [ ] **사용자 알림**

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 6 (T1 브랜치 + T2 logger 이동 / T3 settings NestJS 제거 / T4 nestjs/settings 신규 / T5 검증 + T6 ship) |
| **예상 commit 수** | 4 (T1 / T5 commit 없음) |
| **test 수** | 19 (이전 19와 같음, 위치만 이동) |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-05-19 |
