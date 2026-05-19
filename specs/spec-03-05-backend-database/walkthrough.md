# Walkthrough: spec-03-05

> phase-03 5번째 spec. ADR-0015 5회째 적용 — pure (`@repo/backend-database`) + 어댑터 (`@repo/nestjs-database`) 2 패키지. drizzle-orm + node-postgres + Repository 패턴 컨벤션 박음.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| ORM | drizzle / prisma / typeorm | **drizzle** (locked) | ADR-0005 locked. auth-session SQL 정밀 제어 + 운영 비용 1 ORM |
| PostgreSQL driver | `pg` (node-postgres) / `postgres` (porsager) | **`pg`** | mature + NestJS 생태계 표준 + drizzle-orm/node-postgres 어댑터 official. driver 교체 ADR은 *교체 검토 시점* |
| 연결 primitive | `pg.Pool` (keepalive) / `pg.Client` (single) | **`pg.Pool`** | connection 재사용 + production 표준 |
| schema 위치 | 본 패키지에 박음 / app-level | **app-level** (`apps/<app>/src/db/schema/`) | service별 자유 + 본 패키지는 *infra factory* 만 |
| schema 전달 방식 | 자동 detect / generic 인자 | **generic** (`createDatabase<TSchema>`) | typed query API 보존 (Drizzle 강점) |
| migrate 구현 | 자체 구현 / drizzle-kit api wrap / CLI 직접 | **drizzle-kit api wrap** | drizzle-kit이 이미 maintain — wrapping 최소 + AppError 변환만 |
| logger 연계 | 항상 활성 / 옵셔널 flag | **옵셔널 `logQueries` flag** (default false) | production 보안 + 성능. dev 디버깅에서 켬 |
| logger debug payload | 문자열 / 구조화 객체 | **`{ query, params }` 구조** | pino structured logging 친화 |
| shutdown 위치 | 본 패키지 (pure) + 어댑터에서 호출 | **pure에 helper / 어댑터가 NestJS lifecycle 박음** | NestJS OnModuleDestroy는 *provider class* 만 동작 → 어댑터에 `DatabaseShutdownService` class |
| OnModuleDestroy 박는 방식 | useValue 객체 (불가) / useFactory + class / @Injectable | **useFactory + class** (`useFactory: () => new DatabaseShutdownService(database)`) | NestJS lifecycle hook은 *class instance* 필요. useValue 객체 안 됨 |
| Repository 패턴 적용 layer | 본 spec 안 abstract class / 컨벤션만 / app-level docs | **컨벤션만** — module docstring + spec-03-07 예제 | Generic Repository<T> 함정 회피 (anti-pattern). 컨벤션이 *진짜 가치* |
| 단위 test 전략 | real PostgreSQL (testcontainers) / mock | **mock** (vi.mock pg + drizzle) | 본 spec scope = factory + helper 검증. integration test는 별 spec / phase-10 |
| 어댑터 패턴 | ADR-0015 일관 | **객체 리터럴 DynamicModule + symbol** | 5회 반복 (settings / settings-nestjs / logger-nestjs / http-client-nestjs / database-nestjs) — **ADR 격상 즉시 후보** (Icebox) |

### ADR 승격 가이드

- [x] ADR 승격 대상 있음:
  - **객체 리터럴 DynamicModule 패턴**: 5회 반복 — *후속 spec (03-06 security / 03-07 apps-api) 진입 전*에 ADR 격상 검토 (Icebox)
  - **PostgreSQL driver = `pg`** (vs `postgres`): 부분 후보. driver 교체 검토 시점에 ADR.

## 💬 사용자 협의

- **주제 1 — ORM 추상화 / Repository 패턴**: 사용자 *"drizzle, prisma 두개가 엄청큰 후보야 둘 다 가능한 형태를 모두 담을 수 있는 구조로 미리 설계해서 지원해줘야 할 것 같은데"* → ADR-0005 (Drizzle 단일) 환기 + 옵션 (universal wrapper anti-pattern / 양쪽 패키지 / 현 ADR 유지) 비교.
- **주제 2 — 의도 명확화**: 사용자 *"둘다 지원 x, 하지만 둘 다 지원 할 수 있는 레이어 계층은 필요함 .. interface ↔ orm ↔ db, 코드에서 db 연동시 누굴 통해서 가고 있는지를 모르게 하고 싶은거였음"* → **Repository 패턴 + Persistence Ignorance** 으로 정확히 catch.
- **주제 3 — 합의된 접근**: 본 spec scope 변경 *최소* — `createDatabase` factory + DI 만으로 *Repository 패턴 가능*. abstract base class는 *premature abstraction* 회피. *컨벤션 docs* 박음 + spec-03-07에서 실 예제.
- **주제 4 — Plan Accept**: 사용자 *"좋아 go"* → Strict Loop 진입.

## 🔁 진행 과정

### T1 — 브랜치 생성

- `git checkout -b spec-03-05-backend-database` (시작: `phase-03-backend-foundation`)
- carry-over: sdd auto-update backlog/* — T2 commit에 통합

### T2 — scaffold + drizzle/pg 정찰 + catalog (`5d28069`)

- pnpm-workspace catalog 4 추가:
  - runtime: `drizzle-orm ^0.45.2`, `pg ^8.21.0`
  - types: `@types/pg ^8.20.0`
  - toolchain: `drizzle-kit ^0.31.10`
- `packages/backend/database/` scaffold (spec-03-02 패턴 답습):
  - deps: drizzle-orm + pg + @repo/backend-logger + @repo/errors
  - devDeps: 표준 + @types/pg + drizzle-kit
  - tsconfig: types ["node"] only — DOM 미포함, decorators 없음 (pure)
- API 정찰: drizzle-orm/node-postgres / migrator / pg 모두 export 확인
- placeholder + typecheck ✓

### T3 — `createDatabase` factory (TDD, `5222e6e`)

- **RED**: 3 test (connectionUrl + schema / generic 통과 / poolSize)
- **구현**:
  - module docstring에 *Repository 패턴 권장 가이드* 명시 (apps/<app>/src/{domain,infra,application} 3-layer 분리)
  - `CreateDatabaseOptions<TSchema>` / `Database<TSchema>` 타입
  - `createDatabase`: `pg.Pool` 생성 + `drizzle(pool, { schema, logger })` wrap
  - `NodePgDatabase` re-export
- **GREEN**: 3/3 ✓
- mock pg.Pool issue: `vi.fn().mockImplementation()` 가 constructor로 동작 안 함 → `class PoolMock` 으로 수정
- typecheck 1차 fail (`as` cast) → `as unknown as` 로 수정

### T4 — `shutdown` + `migrate` helper (`047b124`)

- **test 3 추가** (6 누적):
  - shutdown — pool.end() 호출 검증
  - migrate — drizzle-kit migrate api 호출 검증 + 인자 통과
  - migrate 실패 → AppError MIGRATION_FAILED (statusCode 500, cause 보존)
- 구현은 T3에서 이미 박혀있어 *test 추가만으로* 통과

### T5 — logger 연계 + nestjs/database 어댑터 (`1bd4b91`)

- **backend-database logger integration** (test 2 추가, 8 누적):
  - logQueries: true + logger 시 drizzle `{ logger: { logQuery } }` 옵션 활성
  - logQueries: false (default) — drizzle logger 옵션 false
- **`@repo/nestjs-database` 신규** (어댑터, ADR-0015 5회째):
  - DATABASE symbol
  - DatabaseModule.forRoot<TSchema>(options) DynamicModule
  - DatabaseShutdownService implements OnModuleDestroy — pool 보유 + onModuleDestroy → shutdown
  - useFactory 패턴으로 ShutdownService 박음 (useValue 객체에는 lifecycle hook 안 박힘)
  - module docstring: DATABASE symbol *infra layer 안에서만* 강조
- vitest mock hoisting 이슈 우회: `DatabaseShutdownService` test는 *fake pool 직접 inject* 패턴 (실 mock pool 의존성 회피)
- 검증: 어댑터 test 2/2 ✓

### T6 — Ship (본 commit)

- 전체 검증:
  - `pnpm lint` ✓ / `pnpm typecheck` ✓ FULL TURBO / `pnpm test` ✓
  - `depcruise` ✔ no violations (61 modules / 91 deps)
- walkthrough + pr_description 작성
- sdd ship + push + PR

## 🧪 검증 결과

### 자동화 테스트

| 패키지 | test 수 | describe |
|---|:---:|---|
| `@repo/backend-database` (pure) | 8 | createDatabase (3) + shutdown (1) + migrate (2) + logger integration (2) |
| `@repo/nestjs-database` (어댑터) | 2 | DatabaseModule (1) + DatabaseShutdownService (1) |
| **합계** | **10** | — |

### depcruise

```
✔ no dependency violations found (61 modules, 91 dependencies cruised)
```

ADR-0015 룰 모두 통과.

### 수동 검증 (실 사용 패턴)

```ts
// apps/api 가설 사용 패턴
import { createDatabase, migrate } from "@repo/backend-database";
import { DatabaseModule, DATABASE } from "@repo/nestjs-database";
import * as schema from "./db/schema/index.js";

// boot
@Module({
  imports: [
    DatabaseModule.forRoot({
      connectionUrl: process.env.DATABASE_URL!,
      schema,
      logger: logger,
      logQueries: process.env.NODE_ENV === "development",
    }),
  ],
})
export class AppModule {}

// Repository (infra layer — Drizzle 직접 사용)
@Injectable()
export class DrizzleUserRepository implements UserRepository {
  constructor(@Inject(DATABASE) private readonly database: Database<typeof schema>) {}
  async findByEmail(email: string) {
    return this.database.db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  }
}

// Application (domain layer — ORM 모름)
@Injectable()
export class CreateUserUseCase {
  constructor(@Inject(UserRepository) private readonly users: UserRepository) {}
  // users 가 Drizzle 인지 Prisma 인지 *모름*
}
```

## 🔍 발견 사항

1. **OnModuleDestroy 가 useValue 객체에 안 박힘**: NestJS lifecycle hook은 *provider class instance*에서만 동작. `useValue: { db, pool }` 객체에 `onModuleDestroy` 메서드 박아도 호출 안 됨. 해법: 별 `DatabaseShutdownService` class + useFactory 박음. **NestJS의 작지만 중요한 디테일** — 다른 어댑터 패키지에서 lifecycle hook 필요시 동일 패턴 답습.
2. **vitest mock hoisting + class constructor**: `vi.fn().mockImplementation(fn)` 가 `new`로 호출 시 constructor 처럼 동작 안 함 → `class PoolMock {}` 정의가 안전. *backend 패키지에서 자주 만남* — 다른 어댑터 mock에도 반복될 패턴.
3. **drizzle logger 옵션 = `false | { logQuery }`**: drizzle의 logger 옵션이 *boolean false* 또는 *객체* 받음. 우리 패키지가 *옵셔널 활성*화 시 `false` 명시 전달 — production 안전.
4. **Repository 패턴 *컨벤션*이 정답**: 사용자 의도 *"누굴 통해 가는지 모르게"* 는 *interface + DI* 만으로 충분. abstract base class는 *premature abstraction*. spec-03-07에서 실 예제 박을 예정.
5. **ADR-0015 패턴 5회 반복 안정**: settings / settings-nestjs / logger-nestjs / http-client-nestjs / database-nestjs — 모두 *객체 리터럴 DynamicModule + symbol injection token*. **ADR 격상 즉시 후보** (Icebox 명시).
6. **module docstring이 컨벤션 박음에 효과적**: `@repo/backend-database` src/index.ts 상단 docstring에 Repository 패턴 권장 박았음. dev가 IDE에서 hover 시 *즉시 발견*. README보다 *코드 근처*에 박는 가치.
7. **catalog 4개 동시 추가 — 패키지당 dep 증가량 ↑**: drizzle-orm + pg + @types/pg + drizzle-kit. pnpm catalog가 *모든 spec에서 한 곳 관리*라 추가 비용 0 (각 패키지가 `"catalog:"` 만 명시).

## 🚧 이월 항목

- **real PostgreSQL integration test**: 별 spec / phase-10. testcontainers vs docker-compose 결정 (queue.md Icebox에 이미 있음).
- **Repository 패턴 실 예제**: spec-03-07 apps/api scaffold — health-check 또는 simple User 도메인 1개.
- **ADR-0015 객체 리터럴 DynamicModule 패턴 ADR 격상**: 5회 반복 → 곧 ADR 작성 가치. *spec-03-06 / 03-07 진입 전* 검토.
- **PostgreSQL driver = pg 결정 ADR**: 부분 후보. *driver 교체 검토* 시점에 격상.

## 📅 메타

| 항목 | 값 |
|---|---|
| **작성자** | Agent + dennis |
| **작성 기간** | 2026-05-19 |
| **commits** | 4 (T2 5d28069 + T3 5222e6e + T4 047b124 + T5 1bd4b91) + T6 ship (본 commit) |
| **test 수** | 10 (backend 8 + nestjs 2) |
| **depcruise** | 0 violations (61 modules / 91 deps) |
