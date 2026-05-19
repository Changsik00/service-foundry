---
id: ADR-0016
type: convention
date: 2026-05-19
status: accepted
---

# ADR-0016: NestJS Adapter — Standard `@Module` Class Pattern

## 📚 Context

[ADR-0015](./0015-framework-adapter-naming-and-layout.md) 로 *framework adapter 카테고리/명명* 컨벤션이 박혔다. 이후 5 어댑터 패키지 (spec-03-02~05) 가 모두 *"객체 리터럴 DynamicModule + symbol injection token"* 패턴 답습:

| 패키지 | 구현 |
|---|---|
| `@repo/nestjs-settings` | `export const BackendSettingsModule = { forRoot(...) {...} }` |
| `@repo/nestjs-logger` | `export const BackendLoggerModule = { forRoot(...) {...} }` |
| `@repo/nestjs-http-client` | `export const HttpClientModule = { forRoot(...) {...} }` |
| `@repo/nestjs-database` | `export const DatabaseModule = { ... }` + `DatabaseShutdownService` 우회 class |

5회 반복 후 *내부 review* 에서 다음 문제 인식:

1. **"runtime dep 0" 의 환상**: 어댑터 패키지가 *어차피* `@nestjs/common` 을 `dependencies` 에 박음. type-only import 의 *실 가치 거의 없음* — `pnpm install` 시점에 NestJS 어차피 `node_modules` 들어옴. 비-NestJS app 에서 본 어댑터 패키지 사용 0 (Fastify app 은 별 `fastify-*` 어댑터 사용).
2. **Lifecycle hook 우회 복잡**: `DatabaseShutdownService` 같은 별 class + `useFactory` 박는 *우회 패턴*. 표준 `@Module` class + `OnModuleDestroy` 면 *자연*.
3. **Onboarding 비용 ↑**: `@Module` decorator class 는 *NestJS 표준* — 새 dev *즉시 이해*. 객체 리터럴은 *우리 자체 컨벤션* → ADR/docs 없이 *"왜 이렇게?"* 질문.
4. **NestJS ecosystem 친화성 ↓**: `DiscoveryService` / `Reflector` / CQRS / lifecycle / interceptor auto-registration 등 *class metadata 기반*. 객체 리터럴 패턴은 *벽*.
5. **AI/copilot 부정확**: 표준 패턴은 *AI가 잘 만듦*. 우리 컨벤션은 *매번 환기* 필요.
6. **NestJS-locked monorepo**: ADR-0005 NestJS locked + `apps/{api, admin, worker}` 전부 NestJS 예정. Fastify/Hono 어댑터 *현실적 필요 없음* → 객체 리터럴은 *over-engineering*.

ADR-0015 의 *framework-agnostic 원칙* 은 **core 패키지** (`packages/backend/*`) 에 한정. **어댑터 패키지** (`packages/nestjs/*`) 의 *내부 구현 패턴* 은 별 결정 — 본 ADR 로 박는다.

## ✅ Decision

```txt
어댑터 패키지 module 구현:    표준 @Module decorator class (기본 권장)
                            ultra-thin adapter 는 객체 리터럴 허용 (예외)
Injection token:             Symbol(...) — 유지 (ADR-0015 일관)
Lifecycle hook:              Module class 자체에 implements OnModuleDestroy
                            (DatabaseShutdownService 같은 우회 class 제거)
TypeScript decorator:        experimentalDecorators + emitDecoratorMetadata (이미 활성)
```

### 1. 표준 `@Module` decorator class — 기본 권장

```ts
// packages/nestjs/database/src/index.ts (목표 패턴)
import { Module, type DynamicModule, type OnModuleDestroy } from "@nestjs/common";
import { type CreateDatabaseOptions, createDatabase, type Database, shutdown } from "@repo/backend-database";

export const DATABASE = Symbol("DATABASE");

@Module({})
export class DatabaseModule implements OnModuleDestroy {
  private static currentPool: { end: () => Promise<void> } | undefined;

  static forRoot<TSchema extends Record<string, unknown>>(
    options: CreateDatabaseOptions<TSchema>,
  ): DynamicModule {
    const database = createDatabase(options);
    DatabaseModule.currentPool = database.pool;
    return {
      module: DatabaseModule,
      providers: [{ provide: DATABASE, useValue: database }],
      exports: [DATABASE],
      global: true,
    };
  }

  async onModuleDestroy(): Promise<void> {
    if (DatabaseModule.currentPool) {
      await shutdown(DatabaseModule.currentPool as never);
    }
  }
}
```

특징:
- **NestJS 표준 패턴**: dev 가 *즉시 이해*
- `@Module({})` decorator — `DiscoveryService` / `Reflector` 같은 NestJS 도구가 *클래스 metadata 스캔* 가능
- `implements OnModuleDestroy` — lifecycle hook *자연*
- `static forRoot` — DynamicModule 반환 (NestJS 표준 시그니처)

### 2. Ultra-thin adapter 예외 — 객체 리터럴 허용

다음 조건 *모두* 만족 시 객체 리터럴 허용:
- token-only export 또는 단순 wrap (factory 한 줄 정도)
- **lifecycle hook 불필요** (`OnModuleInit` / `OnModuleDestroy` 등)
- NestJS ecosystem 기능 (`DiscoveryService` / CQRS 등) 사용 불필요

예:
```ts
// 단순 token + 단순 useValue — 객체 리터럴 OK
export const FEATURE_FLAGS = Symbol("FEATURE_FLAGS");
export const FeatureFlagsModule = {
  forRoot(flags: Record<string, boolean>) {
    return {
      module: FeatureFlagsModule,
      providers: [{ provide: FEATURE_FLAGS, useValue: flags }],
      exports: [FEATURE_FLAGS],
      global: true,
    };
  },
};
```

이런 *ultra-thin* 케이스는 `@Module` decorator 박는 *추가 비용 > 이득*. 객체 리터럴이 *충분*.

**판단 기준**: lifecycle hook 또는 NestJS ecosystem 기능 *예측 가능*하면 → `@Module` class. 아니면 → 객체 리터럴 허용.

### 3. Symbol token + Core 패키지는 변경 0

- `BACKEND_*` / `DATABASE` 등 symbol injection token — 그대로 유지 (호출자 코드 영향 0)
- `packages/backend/*` core 패키지 — *framework-agnostic 유지* (ADR-0015 §4-bis 그대로). 본 ADR 영향 없음.

### 4. 기존 5 어댑터는 *재구성 예정*

본 ADR ship 직후, 기존 5 어댑터 (`nestjs-{settings, logger, http-client, database}` + spec-03-03 relocate 결과물) 는 *위반 상태* — 후속 재구성 spec 에서 표준 `@Module` class 로 정정.

## 🔁 Alternatives Considered

| 옵션 | 무엇 | 거부/채택 사유 |
|---|---|---|
| **A. 객체 리터럴 강제 (현 상태)** | 모든 어댑터 객체 리터럴 + lifecycle 우회 class | ❌ runtime dep 0 환상 + onboarding 비용 ↑ + lifecycle 우회 복잡 + NestJS ecosystem 친화성 ↓ |
| **B. `@Module` class 강제 (예외 없음)** | 모든 어댑터 표준 `@Module` class | ⚠️ ultra-thin adapter 에 *과한 boilerplate*. 토큰만 export 하는 패키지에도 `@Module({})` 박는 건 *비용 > 이득* |
| **C. 둘 다 허용 (강제 없음)** | 컨벤션 없음 — dev 선택 | ❌ *일관성 부재*. 다른 dev/AI 가 *어느 패턴 따를지 모름* — 매번 결정 |
| **D. 절충안 (채택)** | `@Module` class 기본 권장 + ultra-thin 객체 리터럴 예외 | ✅ NestJS 표준 친화 + pragmatic governance + 일관성 (대부분은 class, 예외 명확) |

## 🎯 Consequences

### 장점

- **Onboarding ↑**: 새 dev / AI 가 *즉시 이해* — NestJS 공식 패턴
- **Lifecycle 자연**: `implements OnModuleDestroy/Init` 직접 — 우회 class 제거
- **NestJS ecosystem 친화**: `DiscoveryService` / `Reflector` / CQRS / Interceptor auto-registration *호환*
- **AI/copilot 정확**: 표준 패턴 — 매번 컨벤션 환기 불필요
- **확장성 ↑**: NestJS 미래 기능 (decorator 기반) 활용 시 *벽 없음*
- **ADR-0015 와 일관**: core (framework-agnostic) vs adapter (framework 친화) 책임 분리 *명확*

### 단점

- **TypeScript decorator 의존**: `experimentalDecorators` + `emitDecoratorMetadata` 강제 (이미 어댑터 패키지에 박혀있음 — 비용 추가 0)
- **JS decorator spec 변화 영향**: 미래 standard decorator (TC39 Stage 3) 와 *호환 작업* 필요할 수 있음. 영향 시점에 NestJS 가 *공식 migration* 제공할 것으로 예상
- **`@nestjs/common` dep 명시화**: 이미 어댑터 패키지에 `dependencies` 로 박혀있음 — 새 비용 없음. 다만 *type-only* 가 아닌 *value import* 가 명시적으로 박힘
- **기존 5 어댑터 재구성 비용**: 본 ADR ship 후 후속 spec 에서 재구성. *use site 0* (apps 미존재) — 재구성 비용 거의 0

### Tradeoff 요약

```
얻음: Onboarding / Lifecycle / Ecosystem / AI 친화
잃음: "framework-agnostic adapter" 의 환상 (실 가치 거의 없었음)
```

## 🔁 Revisit Triggers

- **NestJS major upgrade** (v12 등) — `@Module` signature / decorator 변화 검토
- **다른 framework adapter 추가** (Fastify / Hono 등) — Fastify 도 *plugin 패턴* 있음. *각 framework 의 표준 패턴* 채택 + 본 ADR 일반화 검토
- **JS standard decorator (TC39 Stage 4)** — `experimentalDecorators` 폐기 시점에 migration
- **NestJS ecosystem 기능 *불사용*** — DiscoveryService / Reflector / CQRS 가 *전혀 안 쓰이면* 객체 리터럴 회귀 검토 (현실적으로 일어나지 않을 가능성)

## 📚 관련 문서

- [ADR-0005](./0005-backend-framework-and-orm-strategy.md) — NestJS locked
- [ADR-0015](./0015-framework-adapter-naming-and-layout.md) — Framework adapter 카테고리/명명 (본 ADR 로 *모듈 구현 패턴* 절 격리)
- memory `feedback_platform_agnostic_packages` — core vs adapter 책임 분리
- 후속 spec: 5 어댑터 재구성 (`packages/nestjs/{settings,logger,http-client,database}` → 표준 `@Module` class)
