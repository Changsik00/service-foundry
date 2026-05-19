# Walkthrough: spec-03-06

> phase-03 6번째 spec. ADR-0016 (PR #15) 적용 — 4 어댑터 패키지 객체 리터럴 → 표준 `@Module` decorator class 재구성. `DatabaseShutdownService` 우회 class 제거 → `DatabaseModule implements OnModuleDestroy` 직접 박음. 동작 변경 0.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 작업 순서 | settings → logger → http-client → database | **단순 → 복잡 순** | database 가 lifecycle 추가로 가장 복잡 — 단순 3개로 패턴 안정 후 진입 |
| `@Module` decorator metadata | `@Module({...})` 채움 / `@Module({})` 빈 | **빈 (`@Module({})`)** | providers / exports 는 `forRoot` 가 *동적* return — class-level metadata 빈 OK |
| `forRoot` 시그니처 | `static forRoot(...): DynamicModule` | 채택 | NestJS 표준. 객체 리터럴 시점과 *동일 시그니처* |
| pool 보유 (database) | static field / instance field / class-private external | **static field** (`DatabaseModule.currentDatabase`) | forRoot 가 static — 같은 class context. NestJS 인스턴스 시점에 *동일 reference* |
| `DatabaseShutdownService` 처리 | 유지 / 제거 | **제거** | ADR-0016 핵심 동기 — 우회 class 더 이상 불필요 |
| biome `noStaticOnlyClass` 룰 충돌 | inline biome-ignore / 패키지별 override / config 전체 | **biome-config overrides** (`packages/nestjs/**`) | inline ignore 가 `@Module` decorator 와 충돌 → packages/nestjs 한정 override 가 깔끔 |
| test mock 패턴 (database) | vi.mock("pg") / vi.mock("@repo/backend-database") / fake pool inject | **`vi.mock("@repo/backend-database")`** | workspace dep transitive — pg mock 이 backend-database 안 import 못 미침. backend-database 자체를 mock |
| Provider union 타입 narrowing (test) | NestJS Provider 정확 타입 / `as any` cast | **`as any` cast (biome-ignore)** | unit-level test — union narrowing 복잡도 회피. test 동작 정확 |
| commit 단위 | 패키지별 1 commit | 채택 (4 commit) | revert 단위 명확 + 패키지별 review 쉬움 |

### ADR 승격 가이드

- [x] **없음** — 본 spec 은 ADR-0016 적용. 추가 ADR 가치 없음.

## 💬 사용자 협의

- **사용자 결정**: *"A 진행"* — spec-03-06 rework 진입.
- **Plan Accept**: 즉시.
- 본 spec 진행 중 별도 사용자 협의 없음 (사전 합의된 작업).

## 🔁 진행 과정

### T1 — 브랜치 생성

- `git checkout -b spec-03-06-rework-nestjs-adapters` (시작: `phase-03-backend-foundation`)

### T2 — `@repo/nestjs-settings` 재구성 (`6604c7d` — amend 적용)

- 객체 리터럴 → `@Module({}) class BackendSettingsModule { static forRoot }`
- `BACKEND_SETTINGS` symbol / providers / exports / global: true 그대로
- 1차 commit 후 biome warning (`noStaticOnlyClass`) 발견 → inline `biome-ignore` 시도 (효과 없음 — decorator 위 comment 처리 안 됨) → amend 로 commit 정정
- test 2/2 ✓

### T2-bis — biome override (`1a846ee`)

- `packages/config/biome-config/base.json` overrides 추가:
  ```json
  "overrides": [
    {
      "includes": ["packages/nestjs/**/src/**"],
      "linter": { "rules": { "complexity": { "noStaticOnlyClass": "off" } } }
    }
  ]
  ```
- inline `biome-ignore` comment 제거 (settings + logger 양쪽)
- 한 commit 으로 *모든 어댑터 패키지* 룰 해결 — 후속 어댑터 (http-client / database) 도 자동 통과
- `pnpm lint` 0 warnings ✓

### T3 — `@repo/nestjs-logger` 재구성 (`29dad77`)

- 객체 리터럴 → `@Module({}) class BackendLoggerModule { static forRoot }`
- `BACKEND_LOGGER` symbol + `PinoLoggerService` class 그대로
- `PinoLoggerService` 는 이미 class 기반 — `LoggerService implements` 그대로
- test 4/4 ✓
- **typecheck 1차 fail**: NestJS `Provider` union type 안에 `Type<any>` (class shorthand) — `.useValue` access 불가 → test에 `as any` cast + 명시 type cast 박음

### T4 — `@repo/nestjs-http-client` 재구성 (`0f6b99c`)

- 객체 리터럴 → `@Module({}) class HttpClientModule { static forRoot }`
- `HTTP_CLIENT` symbol provider 그대로
- 사용 안 되던 `HttpClient` import + `HttpClientDynamicModuleProvider` interface 제거 (NestJS 표준 `DynamicModule` 으로 통합)
- test 1/1 ✓

### T5 — `@repo/nestjs-database` + `OnModuleDestroy` 직접 (`51852d5`)

가장 복잡한 변경:

- 객체 리터럴 + `DatabaseShutdownService` 우회 class → 표준 `@Module class implements OnModuleDestroy`
- `DatabaseShutdownService` **제거**
- `private static currentDatabase` field — pool 보유 (forRoot static 와 같은 class context)
- `async onModuleDestroy(): Promise<void>` instance method — NestJS lifecycle hook 직접
- providers 정리: `DATABASE` symbol 만 (DatabaseShutdownService useFactory 제거)

**test 정정**:
- DatabaseShutdownService import / test 제거
- `DatabaseModule.onModuleDestroy` 직접 호출 test 추가
- mock 패턴 변경: `vi.mock("pg") + vi.mock("drizzle-orm/node-postgres")` 가 *backend-database 안 import 못 미침* → `vi.mock("@repo/backend-database")` 자체를 mock
  - `createDatabase` mock → `{ db, pool: { end: mockPoolEnd } }` fake return
  - `shutdown` mock → `pool.end()` 호출
- 디버그 단계: mockPoolEnd 호출 안 됨 → 발견: workspace dep transitive mock 실패 → backend-database 직접 mock 으로 해결
- test 2/2 ✓

### T6 — Ship (본 commit)

- 전체 검증:
  - `pnpm lint` ✓
  - `pnpm typecheck` ✓ FULL TURBO
  - `pnpm test` ✓ (9 test)
  - `pnpm exec depcruise` ✔ no violations (61 modules / 93 deps)
- 수동 검증:
  - `grep "export const \(Backend\|Http\|Database\)" packages/nestjs/` → 0 hit ✓
  - `grep "DatabaseShutdownService" packages/nestjs/` → 0 hit ✓
- walkthrough + pr_description 작성
- sdd ship + push + PR

## 🧪 검증 결과

### 자동화 테스트

| 패키지 | test 수 | 상태 |
|---|:---:|:---:|
| `@repo/nestjs-settings` (어댑터) | 2 | ✓ |
| `@repo/nestjs-logger` (어댑터) | 4 | ✓ |
| `@repo/nestjs-http-client` (어댑터) | 1 | ✓ |
| `@repo/nestjs-database` (어댑터) | 2 | ✓ |
| **합계** | **9** | **all green** |

이전 9 test 동일 — *위치/내용 거의 동일*, test 코드만 NestJS Provider union 호환 적응.

### depcruise

```
✔ no dependency violations found (61 modules, 93 dependencies cruised)
```

### 수동 검증

| 항목 | 명령 | 결과 |
|---|---|---|
| 객체 리터럴 잔재 | `grep "export const \(Backend\|Http\|Database\)" packages/nestjs/` | 0 hit ✓ |
| 우회 class 잔재 | `grep "DatabaseShutdownService" packages/nestjs/` | 0 hit ✓ |
| `@Module` decorator 4 패키지 모두 사용 | `grep "@Module" packages/nestjs/*/src/index.ts` | 4 hit ✓ |
| biome warnings | `pnpm lint` | 0 warning ✓ |

## 🔍 발견 사항

1. **biome `noStaticOnlyClass` ↔ NestJS `@Module` 충돌**: NestJS 표준 패턴 (static-only class) 이 biome 룰과 충돌. inline `biome-ignore` 가 decorator 위 comment 처리 안 됨. **해결**: `biome-config overrides` 로 `packages/nestjs/**` 한정 룰 disable. 깔끔 + 후속 어댑터에 자동 적용.

2. **vitest workspace dep transitive mock 실패**: `vi.mock("pg")` + `vi.mock("drizzle-orm/node-postgres")` 가 *현 패키지 import 만* mock — `@repo/backend-database` (workspace dep) 안의 import 는 *별도 module instance* 라 mock 적용 안 됨. **해결**: `@repo/backend-database` 자체를 mock (`createDatabase` / `shutdown` fake return). 추후 다른 어댑터 패키지에서 동일 패턴 — *workspace dep 의 외부 라이브러리 mock 못 함* 명시.

3. **NestJS `Provider` union narrowing 복잡도**: `DynamicModule.providers: Provider[]` 의 `Provider` 가 union (Type / ValueProvider / ClassProvider / FactoryProvider 등). `.useValue` / `.provide` access 시 narrowing 필요. test 에서 `as any` cast + biome-ignore — *unit test 가독성 우선*. 정확한 narrowing 은 *호출 site* 에서.

4. **NestJS 의 `class Type<any>` shorthand provider 형태**: `providers: [SomeProvider]` 처럼 *class 만* 박으면 NestJS 가 자체적으로 `{ provide: SomeProvider, useClass: SomeProvider }` 추론. 우리 경우는 항상 *명시적 object 형태* → 검증 시 narrowing 필요.

5. **`DatabaseShutdownService` 제거의 가치**: spec-03-05 walkthrough §발견 사항 #1 *"useValue 객체에 lifecycle hook 안 박힘"* 의 *근본 해결*. ADR-0016 표준 `@Module` class 채택 → 우회 class 더 이상 불필요. 코드 *line count* 70 → 50 으로 약 30% 감소.

6. **`static currentDatabase` 패턴의 한계**: 같은 `DatabaseModule` 을 *두 번 forRoot* 호출하면 두 번째가 *덮어씀*. 현실적으로 *한 app = 한 DB connection pool* 이라 OK. 다중 DB connection 시점 (multi-tenant 등) 에 *pattern 재검토* 필요 (예: instance-level 보유 + Module 인스턴스 다중화).

7. **commit 단위 패키지별 1**: settings / logger / http-client / database — 각자 *독립 review 가능*. test failure 도 *개별 패키지 단위* 로 격리. 깔끔한 PR diff 구조.

8. **ADR-0016 적용 결과**: 4 어댑터 모두 *NestJS 표준 패턴*. 호출자 (app) 입장에서 `BackendLoggerModule.forRoot({...})` 등 사용 *그대로* — **마이그레이션 비용 0** (사용 site 0 이라 더더욱).

## 🚧 이월 항목

- **spec-03-07 apps-api scaffold**: Repository 패턴 실 예제 박음 — health-check 또는 simple User 도메인 1개 + 3-layer 분리 (`domain` / `infra` / `application`).
- **spec-03-XX backend-security** (또는 phase-03 마지막 spec): helmet / cors / rate-limit. ADR-0016 패턴 답습.
- **NestJS `Provider` union 타입 narrowing utility**: 다른 어댑터/app test 에서 반복 사용 — utility helper extract 검토 가치.
- **다중 DB connection 패턴**: `static currentDatabase` 의 단일 보유 한계 — multi-tenant 시점에 재검토.

## 📅 메타

| 항목 | 값 |
|---|---|
| **작성자** | Agent + dennis |
| **작성 기간** | 2026-05-19 |
| **commits** | 5 (T2 6604c7d + T2-bis 1a846ee + T3 29dad77 + T4 0f6b99c + T5 51852d5) + T6 ship (본 commit) |
| **test 수** | 9 (이전 9 와 같음, 내용 동일 — test 코드만 NestJS Provider union 호환 적응) |
| **depcruise** | 0 violations (61 modules / 93 deps) |
| **위반 해소** | 객체 리터럴 4 패키지 + DatabaseShutdownService 우회 class 1개 |
