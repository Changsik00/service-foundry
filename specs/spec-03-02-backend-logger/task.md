# Task List: spec-03-02

> 모든 task는 한 commit에 대응합니다 (One Task = One Commit).
> **Phase Base Branch 모드** — PR base = `phase-03-backend-foundation`.

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

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 7 (T1 브랜치 + T2 scaffold + T3 createLogger / T4 requestId / T5 PinoLoggerService / T6 Module + T7 ship) |
| **예상 commit 수** | 6 (T1 commit 없음) |
| **예상 test 수** | ~11 (createLogger 3 + requestId 4 + PinoLoggerService 2 + Module 2) |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-05-18 |
