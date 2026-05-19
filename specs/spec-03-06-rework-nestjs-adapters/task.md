# Task List: spec-03-06

> 모든 task는 한 commit에 대응합니다 (One Task = One Commit).
> **Phase Base Branch 모드** — PR base = `phase-03-backend-foundation`.
> 본 spec 은 *패턴 재작성* (ADR-0016 적용). 동작 변경 0.

## Pre-flight

- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md / plan.md / task.md 작성
- [x] phase-03.md SPEC 표 자동 갱신
- [ ] 사용자 Plan Accept

---

## Task 1: 브랜치 생성

- [ ] `git checkout -b spec-03-06-rework-nestjs-adapters` (시작 지점: `phase-03-backend-foundation`)
- [ ] Commit: 없음

---

## Task 2: `@repo/nestjs-settings` 재구성

- [ ] `packages/nestjs/settings/src/index.ts`:
  - `import { Module, type DynamicModule } from "@nestjs/common"` (value import + type import)
  - `export const BackendSettingsModule = {...}` → `@Module({}) export class BackendSettingsModule { static forRoot<TSettings>(...): DynamicModule { ... } }`
  - `BACKEND_SETTINGS` symbol / provider 구조 / global 그대로
- [ ] `pnpm --filter @repo/nestjs-settings typecheck` → 통과
- [ ] `pnpm --filter @repo/nestjs-settings test` → 2/2 그린
- [ ] Commit: `refactor(spec-03-06): @repo/nestjs-settings → standard @Module class (ADR-0016)`

---

## Task 3: `@repo/nestjs-logger` 재구성

- [ ] `packages/nestjs/logger/src/index.ts`:
  - `import { Module, type DynamicModule } from "@nestjs/common"`
  - `export const BackendLoggerModule = {...}` → `@Module({}) export class BackendLoggerModule { static forRoot(...): DynamicModule { ... } }`
  - `BACKEND_LOGGER` symbol + `PinoLoggerService` provider 그대로
  - `PinoLoggerService` class 자체는 이미 class 기반 — 변경 없음 (LoggerService implements)
- [ ] `pnpm --filter @repo/nestjs-logger typecheck` → 통과
- [ ] `pnpm --filter @repo/nestjs-logger test` → 4/4 그린
- [ ] Commit: `refactor(spec-03-06): @repo/nestjs-logger → standard @Module class (ADR-0016)`

---

## Task 4: `@repo/nestjs-http-client` 재구성

- [ ] `packages/nestjs/http-client/src/index.ts`:
  - `import { Module, type DynamicModule } from "@nestjs/common"`
  - `export const HttpClientModule = {...}` → `@Module({}) export class HttpClientModule { static forRoot(...): DynamicModule { ... } }`
  - `HTTP_CLIENT` symbol provider 그대로
- [ ] `pnpm --filter @repo/nestjs-http-client typecheck` → 통과
- [ ] `pnpm --filter @repo/nestjs-http-client test` → 1/1 그린
- [ ] Commit: `refactor(spec-03-06): @repo/nestjs-http-client → standard @Module class (ADR-0016)`

---

## Task 5: `@repo/nestjs-database` 재구성 + `OnModuleDestroy` 직접 박음

- [ ] `packages/nestjs/database/src/index.ts`:
  - `import { Module, type DynamicModule, type OnModuleDestroy } from "@nestjs/common"`
  - `export const DatabaseModule = {...}` → `@Module({}) export class DatabaseModule implements OnModuleDestroy`
  - `DatabaseShutdownService` 별 class **제거**
  - `static currentDatabase: Database<Record<string, unknown>> | undefined` field 추가 (pool 보유)
  - `static forRoot(options): DynamicModule` — createDatabase 호출 + `currentDatabase` 설정
  - `async onModuleDestroy(): Promise<void>` instance method — `await shutdown(currentDatabase.pool)`
  - providers 정리: `DATABASE` symbol 만 (DatabaseShutdownService 제거 후 useFactory 도 제거)
- [ ] `packages/nestjs/database/src/index.test.ts` 정정:
  - `DatabaseShutdownService` 관련 test → `DatabaseModule.onModuleDestroy` 직접 호출 test 로 변경
  - mock 패턴: `vi.hoisted(() => ({ mockPoolEnd: vi.fn() }))` 그대로 활용
- [ ] `pnpm --filter @repo/nestjs-database typecheck` → 통과
- [ ] `pnpm --filter @repo/nestjs-database test` → 2/2 그린
- [ ] Commit: `refactor(spec-03-06): @repo/nestjs-database → @Module class + implements OnModuleDestroy (ADR-0016)`

---

## Task 6: Ship (필수)

- [ ] `pnpm lint` + `pnpm typecheck` + `pnpm test` 그린 (전체 9 test)
- [ ] `pnpm exec depcruise --config packages/config/depcruise-config/base.cjs packages/` → 0 violations
- [ ] 수동 검증:
  - `grep "export const \(Backend\|Http\|Database\)" packages/nestjs/` → 0 hit
  - `grep "DatabaseShutdownService" packages/nestjs/` → 0 hit
- [ ] `bash .harness-kit/bin/sdd test passed`
- [ ] **walkthrough.md 작성** (결정 + 발견 사항 + 4 어댑터 before/after 비교)
- [ ] **pr_description.md 작성**
- [ ] `sdd ship --check` 통과
- [ ] **Ship Commit**: sdd ship 자동
- [ ] **Push**: `git push -u origin spec-03-06-rework-nestjs-adapters`
- [ ] **PR 생성**: `gh pr create --base phase-03-backend-foundation`
- [ ] **사용자 알림**

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 6 (T1 브랜치 / T2 settings / T3 logger / T4 http-client / T5 database+lifecycle / T6 ship) |
| **예상 commit 수** | 5 (T1 commit 없음) |
| **예상 test 수** | 9 (이전 9 와 같음, 위치/내용 거의 동일) |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-05-19 |
