# Task List: spec-03-02

> 모든 task는 한 commit에 대응합니다 (One Task = One Commit).
> **Phase Base Branch 모드** — PR base = `phase-03-backend-foundation`.
> **2026-05-19 정정**: T7-bis 추가 — platform-agnostic 분리 (NestJS 어댑터 별도 패키지로 이동).

## Pre-flight

- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md / plan.md / task.md 작성
- [x] phase-03.md SPEC 표 자동 갱신
- [ ] 사용자 Plan Accept

---

## Task 1: 브랜치 생성

- [ ] `git checkout -b spec-03-02-backend-logger` (시작 지점: `phase-03-backend-foundation`)
- [ ] Commit: 없음

---

## Task 2: 패키지 scaffold + pino-pretty devDep

- [ ] `packages/backend/logger/` 디렉토리 + scaffold (spec-03-01 패턴):
  - `package.json` deps: `pino` / `@nestjs/common` / `@repo/backend-settings` / `@repo/errors` / `reflect-metadata` (catalog 또는 workspace)
  - `package.json` devDeps: `@types/node` + `pino-pretty` (^11.x, T2 정찰에서 최신 pin) + 표준
  - `peerDependenciesMeta.pino-pretty.optional: true` (prod 제외 가능)
  - `tsconfig.json` (types: ["node"] + DOM 미포함)
  - `vitest.config.ts` (`@repo/vitest-config/node`)
- [ ] `pnpm-workspace.yaml` catalog에 `pino-pretty` 추가 (T2 정찰에서 최신 버전 확정).
- [ ] `pnpm install` → lockfile 갱신.
- [ ] `src/index.ts` placeholder.
- [ ] typecheck → 통과.
- [ ] Commit: `feat(spec-03-02): scaffold @repo/backend-logger (pino + nestjs)`

---

## Task 3: `createLogger` factory + redaction + 첫 test

- [ ] `src/index.test.ts`: `describe("createLogger")` 3 test:
  - level 적용 (debug level → debug log 출력 / info level → debug 무시)
  - 기본 redaction 동작 (password / authorization → "[Redacted]")
  - pretty option (transport 인자 — pino-pretty load 시도)
- [ ] test → Fail.
- [ ] `src/index.ts`: `DEFAULT_REDACT_PATHS` + `createLogger({ level, redact?, pretty? })` 구현.
- [ ] test → Pass.
- [ ] Commit: `feat(spec-03-02): add createLogger factory with default redaction paths`

---

## Task 4: AsyncLocalStorage request-id context + middleware + test

- [ ] `src/index.test.ts`: `describe("requestId context")` 4 test:
  - `runWithRequestId` 안에서 `getCurrentRequestId()` 반환
  - 외부에서 `getCurrentRequestId()` undefined
  - `requestIdMiddleware`: X-Request-Id header 있으면 사용
  - `requestIdMiddleware`: header 없으면 generateRequestId 호출
- [ ] test → Fail.
- [ ] `src/index.ts`: AsyncLocalStorage + `runWithRequestId` / `getCurrentRequestId` / `generateRequestId` / `requestIdMiddleware`.
- [ ] test → Pass.
- [ ] Commit: `feat(spec-03-02): add AsyncLocalStorage request-id context + middleware`

---

## Task 5: `PinoLoggerService` NestJS LoggerService impl + test

- [ ] `src/index.test.ts`: `describe("PinoLoggerService")` 2 test:
  - 6 method (log/error/warn/debug/verbose/fatal) 호출 시 pino 해당 level 호출 (mock)
  - `runWithRequestId` 안에서 호출 시 reqId 자동 attach
- [ ] test → Fail.
- [ ] `src/index.ts`: `PinoLoggerService` class (NestJS `LoggerService` impl).
- [ ] test → Pass.
- [ ] Commit: `feat(spec-03-02): add PinoLoggerService NestJS LoggerService adapter`

---

## Task 6: `BackendLoggerModule.forRoot` DynamicModule + test

- [ ] `src/index.test.ts`: `describe("BackendLoggerModule")` 2 test:
  - `forRoot({ level: "info" })` 호출 → DynamicModule 구조
  - BACKEND_LOGGER provider + PinoLoggerService provider 둘 다 노출
- [ ] test → Fail.
- [ ] `src/index.ts`: `BACKEND_LOGGER` symbol + `BackendLoggerModule.forRoot()` (객체 리터럴).
- [ ] test → Pass.
- [ ] Commit: `feat(spec-03-02): add BackendLoggerModule DynamicModule`

---

## Task 7: Ship (필수)

- [ ] `pnpm lint` + `pnpm typecheck` + `pnpm test` 그린.
- [ ] `bash .harness-kit/bin/sdd test passed`.
- [ ] **walkthrough.md 작성** (결정 + AsyncLocalStorage 패턴 + pino-pretty optional 검증 + 발견 사항).
- [ ] **pr_description.md 작성**.
- [ ] `sdd ship --check` 통과.
- [ ] **Ship Commit**: sdd ship 자동.
- [ ] **Push**: `git push -u origin spec-03-02-backend-logger`.
- [ ] **PR 생성**: `gh pr create --base phase-03-backend-foundation`.
- [ ] **사용자 알림**.

---

## Task 7-bis: Platform-agnostic 분리 (2026-05-19 추가)

> 사용자 발화 *"packages 에서는 어느 플렛폼에 붙을지는 몰라"* — memory `feedback_platform_agnostic_packages` 박힘.

- [x] `packages/backend/logger/src/index.ts` 에서 `LoggerService` import / `PinoLoggerService` / `BACKEND_LOGGER` / `BackendLoggerModule` 제거 + `Logger` 타입 재export 추가
- [x] `packages/backend/logger/package.json` deps 정리: `@nestjs/common` / `@repo/backend-settings` / `@repo/errors` / `reflect-metadata` 제거 → `pino` 만 남김
- [x] `packages/backend/logger/src/index.test.ts` 에서 NestJS 관련 6 test 제거 → 7 test 남음
- [x] `packages/backend/logger-nestjs/` 신규 어댑터 패키지 (package.json / tsconfig / vitest config)
- [x] `packages/backend/logger-nestjs/src/index.ts` 에 `PinoLoggerService` + `BACKEND_LOGGER` + `BackendLoggerModule` 이동
- [x] `packages/backend/logger-nestjs/src/index.test.ts` 작성 (4 test: 6 method routing / reqId child / DynamicModule 구조 / provider 노출)
- [x] `pnpm install` → lockfile 갱신
- [x] `pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm exec depcruise` 모두 그린
- [x] walkthrough / pr_description 갱신
- [ ] Commit: `refactor(spec-03-02): split logger into pure + nestjs adapter (platform-agnostic)`
- [ ] PR #10 force-push

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 7+1 (T1~T7 + T7-bis platform-split) |
| **예상 commit 수** | 7 (T1 commit 없음 + T7-bis 1) |
| **실제 test 수** | 11 (logger 7 + logger-nestjs 4) |
| **현재 단계** | Review (T7-bis 정정 후 PR force-push) |
| **마지막 업데이트** | 2026-05-19 |
