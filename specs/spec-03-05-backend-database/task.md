# Task List: spec-03-05

> 모든 task는 한 commit에 대응합니다 (One Task = One Commit).
> **Phase Base Branch 모드** — PR base = `phase-03-backend-foundation`.

## Pre-flight

- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md / plan.md / task.md 작성
- [x] phase-03.md SPEC 표 자동 갱신
- [ ] 사용자 Plan Accept

---

## Task 1: 브랜치 생성

- [ ] `git checkout -b spec-03-05-backend-database` (시작 지점: `phase-03-backend-foundation`)
- [ ] Commit: 없음

---

## Task 2: scaffold + drizzle/pg 정찰 + catalog 추가

- [ ] `pnpm-workspace.yaml` catalog 추가:
  - `drizzle-orm: ^0.45.2`
  - `drizzle-kit: ^0.31.10`
  - `pg: ^8.21.0`
  - `@types/pg: ^8.20.0`
- [ ] `packages/backend/database/` scaffold:
  - `package.json` deps: drizzle-orm + pg + @repo/backend-logger (workspace) + @repo/errors (workspace)
  - devDeps: 표준 + @types/pg + drizzle-kit
  - `tsconfig.json` (types: ["node"], DOM 미포함, decorators 없음 — pure)
  - `vitest.config.ts` (`@repo/vitest-config/node`)
- [ ] drizzle / pg API 정찰:
  - `drizzle-orm/node-postgres` → `drizzle(pool, { schema, logger })`
  - `drizzle-orm/node-postgres/migrator` → `migrate(db, { migrationsFolder })`
  - `pg.Pool` → `new Pool({ connectionString, max })`, `pool.end()`
- [ ] `src/index.ts` placeholder
- [ ] `pnpm install` + typecheck → 통과
- [ ] Commit: `feat(spec-03-05): scaffold @repo/backend-database (drizzle + pg)`

---

## Task 3: `createDatabase` factory + 기본 test (TDD)

- [ ] `src/index.test.ts`: `describe("createDatabase")` 3 test:
  - connectionUrl + schema 전달 시 `{ db, pool }` 반환 (`pg.Pool` mock)
  - schema generic 통과 (`NodePgDatabase<TSchema>` 타입 검증)
  - poolSize 옵션 적용 (Pool max 옵션 검증)
- [ ] test → Fail
- [ ] `src/index.ts` 구현:
  - `CreateDatabaseOptions<TSchema>` / `Database<TSchema>` 타입
  - `createDatabase`: `pg.Pool` 생성 + `drizzle(pool, { schema })` 호출 + `{ db, pool }` return
- [ ] test → Pass (3)
- [ ] Commit: `feat(spec-03-05): add createDatabase factory with generic schema`

---

## Task 4: `shutdown` + `migrate` helper (TDD)

- [ ] `src/index.test.ts`: `describe("shutdown")` 1 test (`pool.end()` 호출 검증, mock pool)
- [ ] `describe("migrate")` 1 test (drizzle-kit `migrate` 호출 검증, mock으로 module 차원에서)
- [ ] test → Fail (2)
- [ ] `src/index.ts` 구현:
  - `shutdown(pool): Promise<void>` — `pool.end()` await
  - `migrate(db, options): Promise<void>` — `drizzleKitMigrate` wrap + AppError on failure (`MIGRATION_FAILED` 코드, statusCode 500)
- [ ] test → Pass (5 누적)
- [ ] Commit: `feat(spec-03-05): add shutdown + migrate helpers`

---

## Task 5: logger 연계 + `nestjs/database` 어댑터 (TDD)

- [ ] `src/index.test.ts`: `describe("logger integration")` 1 test:
  - `logQueries: true` + `logger` 인자 시 drizzle 옵션에 logger 전달 (mock drizzle 호출 검증)
- [ ] `src/index.ts`: drizzle logger 옵션 wire — `logQuery` callback 으로 `logger.debug(...)` 호출
- [ ] test → Pass (6 누적)
- [ ] `packages/nestjs/database/` scaffold (ADR-0015 패턴 4회째):
  - `package.json` deps: @nestjs/common + @repo/backend-database (workspace) + reflect-metadata
  - devDeps: 표준 + @nestjs/core/testing + rxjs
  - `tsconfig.json` (decorators + node types)
  - `vitest.config.ts`
- [ ] `src/index.test.ts`: `describe("DatabaseModule")` 2 test:
  - `forRoot(options)` → DynamicModule 구조 + DATABASE provider
  - `OnModuleDestroy` 호출 시 shutdown(pool) 호출 (mock pool)
- [ ] test → Fail (2)
- [ ] `src/index.ts` 구현:
  - `DATABASE` symbol injection token
  - `DatabaseModule.forRoot<TSchema>(options)` — `createDatabase` 호출 + DynamicModule
  - `DatabaseShutdownService` provider class (NestJS `OnModuleDestroy` impl) — pool 보유 + onModuleDestroy 에서 shutdown 호출
- [ ] `pnpm install` + test → Pass (8 누적)
- [ ] Commit: `feat(spec-03-05): add logger integration + @repo/nestjs-database adapter`

---

## Task 6: Ship (필수)

- [ ] `pnpm lint` + `pnpm typecheck` + `pnpm test` 그린
- [ ] `pnpm exec depcruise --config packages/config/depcruise-config/base.cjs packages/` → 0 violations
- [ ] `bash .harness-kit/bin/sdd test passed`
- [ ] **walkthrough.md 작성** (결정 + 발견 사항 + driver 선택 사유 + OnModuleDestroy 트릭)
- [ ] **pr_description.md 작성**
- [ ] `sdd ship --check` 통과
- [ ] **Ship Commit**: sdd ship 자동
- [ ] **Push**: `git push -u origin spec-03-05-backend-database`
- [ ] **PR 생성**: `gh pr create --base phase-03-backend-foundation`
- [ ] **사용자 알림**

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 6 (T1 브랜치 / T2 scaffold + 정찰 + catalog / T3 createDatabase / T4 shutdown+migrate / T5 logger + nestjs adapter / T6 ship) |
| **예상 commit 수** | 5 (T1 commit 없음) |
| **예상 test 수** | ~8 (createDatabase 3 + shutdown 1 + migrate 1 + logger 1 + DatabaseModule 2) |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-05-19 |
