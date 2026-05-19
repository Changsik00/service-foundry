# Implementation Plan: spec-03-07 backend-security

## 📋 Branch Strategy

- 신규 브랜치: `spec-03-07-backend-security`
- 시작 지점: `phase-03-backend-foundation` (Phase Base Branch 모드)
- 첫 task 가 브랜치 생성을 수행함

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [x] 패키지 레이아웃: **`@repo/nestjs-security` 단일** (pure `backend-security` 없음 — helmet/cors/throttler 가 HTTP/NestJS-specific)
> - [x] rate-limit 라이브러리: **`@nestjs/throttler`** (NestJS 공식)
> - [x] `APP_GUARD` 자동 등록: `ThrottlerGuard` 가 *모든 라우트* 자동 적용 — opt-out 은 `@SkipThrottle()` decorator (사용자 책임)

> [!WARNING]
> - [ ] *모든 라우트 자동 rate-limit* 채택 — `apps/api` health check 등도 영향. 기본 limit (100req/60s) 이 health probe 빈도와 conflict 가능 (현 시점은 apps 미존재라 위험 0)
> - [ ] catalog 신규 추가: `helmet` / `@nestjs/throttler` — pnpm-workspace.yaml 갱신 필요

## 🎯 핵심 전략 (Core Strategy)

### 아키텍처 컨텍스트

```mermaid
flowchart LR
    main[apps/api main.ts] -->|applySecurity helper| sec[(@repo/nestjs-security)]
    appModule[AppModule] -->|imports| BTM[BackendThrottlerModule.forRoot]
    BTM -->|wraps| TM[ThrottlerModule.forRoot]
    BTM -->|provides| APPGUARD[APP_GUARD: ThrottlerGuard]

    sec -.->|app.use| helmet[helmet]
    sec -.->|app.enableCors| cors[NestJS CORS]
```

### 주요 결정

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| **패키지 위치** | `packages/nestjs/security` (`@repo/nestjs-security`) | ADR-0015 — framework-adapter prefix. pure backend layer 불필요 (HTTP-specific) |
| **helmet wire-up** | `applySecurity(app, opts)` helper | helmet 은 *app instance* 메소드 (`app.use`) — Module 아닌 helper 자연 |
| **cors wire-up** | `applySecurity` 안 `app.enableCors()` | NestJS built-in — 외부 lib 불필요 |
| **rate-limit lib** | `@nestjs/throttler` | NestJS 공식, ThrottlerGuard pattern, ecosystem 자연 |
| **Throttler 등록** | `BackendThrottlerModule.forRoot()` Module | rate-limit 은 *guard + module* 라 `@Module` 자연 (ADR-0016) |
| **Guard 등록 전략** | `APP_GUARD` provider 자동 박음 (모든 라우트) | dev 가 ThrottlerGuard 잊을 위험 제거. opt-out 은 decorator |
| **Throttler default** | `ttl: 60_000` (60s), `limit: 100` | 합리적 baseline. 운영시 app 별 tuning |
| **Throttler storage** | default (in-memory) | 분산 환경 진입 전에는 충분. Redis storage 는 별 spec |

### 📑 ADR 후보

- [ ] ADR 가치 있는 결정 있음
- [x] **없음** — ADR-0015 / ADR-0016 적용. 신규 결정 ADR 가치 없음.

## 📂 Proposed Changes

### `@repo/nestjs-security` 패키지

#### [NEW] `packages/nestjs/security/package.json`
- name: `@repo/nestjs-security`
- dependencies: `@nestjs/common` (catalog), `@nestjs/core` (catalog, APP_GUARD 위해 dep), `@nestjs/throttler` (catalog), `helmet` (catalog), `reflect-metadata` (catalog)
- devDependencies: `@biomejs/biome`, `@nestjs/testing`, `@repo/biome-config`, `@repo/typescript-config`, `@repo/vitest-config`, `@types/node`, `rxjs`, `typescript`, `vitest`
- 다른 어댑터 패키지 (nestjs-settings 등) 와 동일 구조

#### [NEW] `packages/nestjs/security/tsconfig.json`
- 다른 어댑터 패키지와 동일 (extends `@repo/typescript-config/base.json`)

#### [NEW] `packages/nestjs/security/biome.json`
- 다른 어댑터 패키지와 동일 (extends `@repo/biome-config/base.json`)

#### [NEW] `packages/nestjs/security/vitest.config.ts`
- 다른 어댑터 패키지와 동일

#### [NEW] `packages/nestjs/security/src/index.ts`
- `SecurityOptions` 타입 export
- `applySecurity(app, opts)` helper export
- `BackendThrottlerOptions` 타입 export
- `BackendThrottlerModule` (`@Module({}) class implements forRoot static` — ADR-0016)

```ts
// 의사코드 — 실 구현은 task 단계
import { type DynamicModule, Module, type INestApplication } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import helmet from "helmet";

export interface SecurityOptions {
  helmet?: Parameters<typeof helmet>[0] | false;
  cors?: Parameters<INestApplication["enableCors"]>[0] | false;
}

export function applySecurity(app: INestApplication, opts: SecurityOptions = {}): void {
  if (opts.helmet !== false) app.use(helmet(opts.helmet));
  if (opts.cors !== false) app.enableCors(opts.cors);
}

export interface BackendThrottlerOptions {
  ttl?: number;
  limit?: number;
}

@Module({})
export class BackendThrottlerModule {
  static forRoot(opts: BackendThrottlerOptions = {}): DynamicModule {
    return {
      module: BackendThrottlerModule,
      imports: [
        ThrottlerModule.forRoot([
          { ttl: opts.ttl ?? 60_000, limit: opts.limit ?? 100 },
        ]),
      ],
      providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
      exports: [ThrottlerModule],
      global: true,
    };
  }
}
```

#### [NEW] `packages/nestjs/security/src/index.test.ts`
- `applySecurity` test:
  - default opts → `app.use(helmet(...))` + `app.enableCors()` 호출 (spy)
  - `opts.helmet === false` → helmet skip
  - `opts.cors === false` → enableCors skip
  - opts 전달 시 helmet / enableCors 에 forward
- `BackendThrottlerModule.forRoot` test:
  - DynamicModule 구조 (module / imports / providers / exports / global)
  - APP_GUARD provider 존재 + useClass === ThrottlerGuard
  - default ttl / limit (간접 검증 — ThrottlerModule.forRoot 인자 capture)

#### [MODIFY] `pnpm-workspace.yaml`
- catalog 에 `helmet` + `@nestjs/throttler` 추가:
  ```yaml
  "@nestjs/throttler": ^6.4.0
  helmet: ^8.1.0
  ```
  (최신 안정 버전 — 실 install 시 확정)

#### [MODIFY] `backlog/phase-03.md`
- spec 표 자동 갱신 이미 완료 (`sdd spec new` 가 spec-03-07 추가)
- 본문 *작업 단위 (SPECs)* 단락의 spec-03-06 항목이 backend-security 로 적혀있음 — 현재 실제 spec-03-07 이 backend-security 이므로 본문 정정 가능 (단, scope 최소화: ship 시점 1줄 정정)

## 🧪 검증 계획

### 단위 테스트 (필수)
```bash
pnpm --filter @repo/nestjs-security test
# 또는 전체:
pnpm test
```

### 수동 검증 시나리오
1. `grep "applySecurity\|BackendThrottlerModule" packages/nestjs/security/src/index.ts` — 두 export 확인
2. `pnpm exec depcruise --config packages/config/depcruise-config/base.cjs packages/` — 0 violations
3. `pnpm lint && pnpm typecheck && pnpm test` — 모두 그린

## 🔁 Rollback Plan

- 본 spec 은 *신규 패키지 추가* 만 — 기존 코드 영향 0.
- 롤백 시 PR revert + catalog 두 줄 제거. 영향 0.

## 📦 Deliverables 체크

- [x] task.md 작성 (다음 단계 — 본 plan 이후 즉시)
- [ ] 사용자 Plan Accept 받음
- [ ] (실행 후) 모든 task 완료
- [ ] (실행 후) walkthrough.md / pr_description.md ship
