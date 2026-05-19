# feat(spec-03-05): @repo/backend-database (pure) + @repo/nestjs-database (어댑터) — drizzle + pg + Repository 패턴 컨벤션

> Phase 3 (Backend Foundation) **5번째 spec**. ADR-0015 패턴 5회째 적용. drizzle-orm + node-postgres 기반 PostgreSQL 추상화 + NestJS OnModuleDestroy lifecycle + Repository 패턴 *컨벤션* 박음 (Persistence Ignorance).

## 📋 Summary

### 배경 및 목적

ADR-0005 *NestJS + Drizzle + PostgreSQL* locked. Drizzle은 *raw SQL 친화 + typed query builder* — ADR-0013 Session model 같은 *SQL 정밀 제어* 케이스에 강함.

본 spec은 **2 패키지** (ADR-0015 패턴):
- `@repo/backend-database` (pure, framework-agnostic) — `createDatabase<TSchema>()` factory + `shutdown` + `migrate` helper
- `@repo/nestjs-database` (어댑터) — `DatabaseModule.forRoot()` + `DATABASE` symbol + `DatabaseShutdownService` (OnModuleDestroy lifecycle)

**Repository 패턴 컨벤션 명문화**: 사용자 의도 *"코드에서 db 연동시 누굴 통해서 가고 있는지를 모르게 하고 싶은거였음"* → module docstring에 *Repository 패턴 권장 가이드* 박음 (Persistence Ignorance / Clean Architecture). application/domain layer가 *interface만 의존* → ORM 모름 → 향후 ORM 교체 시 *infra layer만 변경*.

### 주요 변경 사항

- [x] **`packages/backend/database/` 신규** (`@repo/backend-database`, pure)
  - `createDatabase<TSchema>({ connectionUrl, schema, poolSize?, logger?, logQueries? })` factory
  - return `{ db: NodePgDatabase<TSchema>, pool: Pool }`
  - `shutdown(pool)` — graceful close
  - `migrate(db, { migrationsFolder })` — drizzle-kit api wrap + AppError MIGRATION_FAILED
  - optional logger integration (logQueries flag, production safe)
  - module docstring: Repository 패턴 권장 가이드 + 3-layer 구조 (domain / infra / application)

- [x] **`packages/nestjs/database/` 신규** (`@repo/nestjs-database`, 어댑터)
  - `DATABASE` symbol injection token
  - `DatabaseModule.forRoot<TSchema>(options)` DynamicModule
  - `DatabaseShutdownService implements OnModuleDestroy` — useFactory 패턴으로 박음 (useValue 객체에 lifecycle hook 안 박힘 — NestJS 디테일)
  - deps: @nestjs/common + @repo/backend-database (workspace) + reflect-metadata

- [x] **catalog 추가 4개**:
  - runtime: `drizzle-orm ^0.45.2`, `pg ^8.21.0`
  - types: `@types/pg ^8.20.0`
  - toolchain: `drizzle-kit ^0.31.10`

### Phase 컨텍스트

- **Phase**: `phase-03` Backend Foundation (Phase Base Branch 모드)
- **PR Target**: `phase-03-backend-foundation`
- **선행**: spec-03-04 backend-http-client (ADR-0015 3회째)
- **본 SPEC 역할**: ADR-0005 핵심 (Drizzle + PostgreSQL) 적용 + Repository 패턴 컨벤션 박음 → 후속 spec (apps-api scaffold) 의 *기반*.

## 🎯 Key Review Points

1. **🎯 Repository 패턴 컨벤션 (Persistence Ignorance)**: 사용자 의도 *"코드에서 db 연동 시 누굴 통해 가는지 모르게"* — module docstring에 가이드 명시. abstract base class **안 박음** (premature abstraction / Generic Repository anti-pattern 회피). `interface + DI`만으로 *Application code가 ORM 모름* 달성. 실 예제는 spec-03-07 apps/api scaffold.

2. **ADR-0015 5회째 패턴 안정 → ADR 격상 후보**: 객체 리터럴 DynamicModule + symbol injection token이 settings / settings-nestjs / logger-nestjs / http-client-nestjs / database-nestjs *5회 반복*. **ADR 격상 즉시 후보** (Icebox 추가됨, *spec-03-06 진입 전* 검토 가치).

3. **PostgreSQL driver = `pg` (node-postgres)**: ADR-0005에 명시 없음 — 본 spec에서 박음. 대안 `postgres` (porsager)는 더 빠르나 mature 부족 + NestJS 생태계 표준은 `pg`. driver 교체 검토 시점에 ADR 격상 후보.

4. **NestJS OnModuleDestroy + useValue 객체 비호환**: NestJS lifecycle hook은 *provider class instance* 에서만 동작. `useValue: { db, pool }` 객체에 박을 수 없음 → 별 `DatabaseShutdownService` class + useFactory 패턴. **다른 어댑터에서 lifecycle hook 필요 시 동일 패턴 답습** (walkthrough §발견 사항 #1).

5. **schema 위치 = app-level**: 본 패키지에 schema 0. `apps/<app>/src/db/schema/` 컨벤션 — service별 자유. 본 패키지는 *generic factory*만 (`createDatabase<TSchema>`).

6. **logger integration optional + `logQueries` flag**: drizzle query 로깅. *production 기본 OFF* (보안 + 성능), dev 디버깅에서 켬. drizzle의 `logger: { logQuery }` 옵션 활성화.

7. **migrate helper = drizzle-kit api wrap (최소)**: drizzle-kit이 이미 maintain — 자체 구현 없이 wrapping. 실패 시 AppError MIGRATION_FAILED (statusCode 500, cause 보존).

8. **단위 test 전략 = mock (real DB 의존 0)**: `vi.mock("pg")` + `vi.mock("drizzle-orm/node-postgres")` 로 외부 dep 0 검증. real PostgreSQL integration test는 *별 spec / phase-10* (testcontainers vs docker-compose 결정 포함).

9. **vitest mock + class constructor 디테일**: `vi.fn().mockImplementation()` 가 `new` 로 호출 시 constructor 동작 안 함 → `class PoolMock {}` 정의 패턴. backend 패키지에서 *반복될 패턴* — utility extract 검토 가치.

10. **catalog 4개 동시 추가**: pnpm catalog 한 곳 관리 — 각 패키지가 `"catalog:"` 만 명시. drizzle-orm + pg + @types/pg + drizzle-kit.

## 🧪 Verification

### 자동 테스트

```bash
pnpm install && pnpm lint && pnpm typecheck && pnpm test
pnpm exec depcruise --config packages/config/depcruise-config/base.cjs packages/
```

**결과**:
- ✅ `pnpm install`: catalog 4개 추가 후 정상 (engines warning 외 0)
- ✅ `pnpm lint`: 13 tasks PASS
- ✅ `pnpm typecheck`: 13 tasks FULL TURBO
- ✅ `pnpm test`: **10 test PASS** (backend 8 + nestjs 2)
- ✅ `depcruise`: **0 violations** (61 modules / 91 dependencies)

### test 분포 (10)

**`@repo/backend-database` (8 test)**:

| describe | test count | 검증 |
|---|:---:|---|
| `createDatabase` | 3 | connectionUrl/schema/Pool 반환 / schema generic 통과 / poolSize 옵션 |
| `shutdown` | 1 | pool.end() 호출 |
| `migrate` | 2 | drizzle-kit api 호출 / 실패 시 AppError MIGRATION_FAILED |
| `logger integration` | 2 | logQueries true 시 drizzle logger 활성 + logQuery → logger.debug / false 시 비활성 |

**`@repo/nestjs-database` (2 test)**:

| describe | test count | 검증 |
|---|:---:|---|
| `DatabaseModule` | 2 | DynamicModule 구조 + DATABASE provider / DatabaseShutdownService.onModuleDestroy → pool.end() (fake pool inject) |

### 수동 검증 (실 사용 패턴)

```ts
// apps/api 가설 (spec-03-07에서 실 박을 예제)
import { DatabaseModule, DATABASE } from "@repo/nestjs-database";
import type { Database } from "@repo/backend-database";
import * as schema from "./db/schema/index.js";

@Module({
  imports: [
    DatabaseModule.forRoot({
      connectionUrl: process.env.DATABASE_URL!,
      schema,
      logger,
      logQueries: process.env.NODE_ENV === "development",
    }),
  ],
})
export class AppModule {}

// Repository (infra layer — Drizzle 직접 사용)
@Injectable()
export class DrizzleUserRepository implements UserRepository {
  constructor(@Inject(DATABASE) private readonly database: Database<typeof schema>) {}
  async findByEmail(email: string) { ... }
}

// Application (ORM 모름)
@Injectable()
export class CreateUserUseCase {
  constructor(@Inject(UserRepository) private readonly users: UserRepository) {}
}
```

## 🔗 참조

- **ADR**: [`docs/adr/0005-backend-framework-and-orm-strategy.md`](../docs/adr/0005-backend-framework-and-orm-strategy.md) (Drizzle + PostgreSQL locked) + [`docs/adr/0015-framework-adapter-naming-and-layout.md`](../docs/adr/0015-framework-adapter-naming-and-layout.md) (pure/어댑터 패턴)
- **walkthrough**: `specs/spec-03-05-backend-database/walkthrough.md` (결정 14 + 사용자 협의 4 + 발견 사항 7)
- **memory**: `feedback_platform_agnostic_packages` + `project_boilerplate_locked_stack`
- **후속 spec**: 
  - **spec-03-06 backend-security** (helmet/cors/rate-limit)
  - **spec-03-07 apps-api-scaffold** — Repository 패턴 실 예제 박음

## 📝 Post-Merge

- [ ] Merge → `phase-03-backend-foundation` (Phase Base Branch 모드)
- [ ] Auto-sync: `backlog/phase-03.md` / `backlog/queue.md` (spec-03-05 → Merged)
- [ ] 사용자 알림 + 후속 spec (03-06 backend-security) 진입 옵션 제시
- [ ] **검토**: ADR-0015 객체 리터럴 DynamicModule 패턴 ADR 격상 (5회 반복 안정)

## ✅ Definition of Done

- [x] `packages/backend/database/` 신규 (pure)
- [x] `packages/nestjs/database/` 신규 (어댑터)
- [x] `createDatabase` + `shutdown` + `migrate` helper
- [x] `DatabaseModule.forRoot()` + `DatabaseShutdownService` (OnModuleDestroy)
- [x] module docstring: Repository 패턴 권장 가이드
- [x] `pnpm test` 그린 (10 test)
- [x] `pnpm lint` / `pnpm typecheck` 그린
- [x] `pnpm exec depcruise` 0 violations (61 modules / 91 deps)
- [ ] `walkthrough.md` / `pr_description.md` ship commit (본 commit 직후)
- [ ] PR 생성 (base = `phase-03-backend-foundation`)
- [ ] 사용자 알림
