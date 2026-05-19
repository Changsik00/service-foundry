# Walkthrough: spec-03-07 backend-security

> phase-03 마지막 인프라 spec. `@repo/nestjs-security` 단일 어댑터 신설 — `applySecurity(app, opts)` helper (helmet + cors) + `BackendThrottlerModule.forRoot()` (`@nestjs/throttler` wrap + `APP_GUARD` 자동 등록). pure backend layer 없음 (helmet/cors/throttler 자체가 HTTP/NestJS-specific). ADR-0015 + ADR-0016 적용.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 패키지 레이아웃 | A: nestjs-security 단일 / B: backend-security pure + nestjs-security adapter / C: helper-only | **A** | helmet/cors/throttler 모두 HTTP/NestJS-specific. pure layer *공허화* 가능성. 어댑터 1개로 충분 |
| helmet wire-up 패턴 | Module forRoot / helper function | **helper (`applySecurity`)** | helmet 은 `app.use()` — *app instance* 메소드. Module 패턴 어색. main.ts 1회 호출이 자연 |
| cors wire-up 패턴 | NestJS built-in (`app.enableCors`) / 외부 cors lib | **NestJS built-in** | NestJS 가 기본 제공. 외부 의존 추가 무의미 |
| rate-limit 라이브러리 | @nestjs/throttler / express-rate-limit | **@nestjs/throttler** | NestJS 공식. ThrottlerGuard 패턴 ecosystem 자연 |
| Throttler Module 패턴 | 객체 리터럴 / `@Module` decorator class | **`@Module` decorator class** | ADR-0016 (NestJS standard pattern) 답습 |
| Guard 등록 전략 | apps/api 가 직접 박음 / `APP_GUARD` provider 자동 | **`APP_GUARD` 자동** | dev 가 ThrottlerGuard 등록 잊을 위험 제거. opt-out 은 `@SkipThrottle()` decorator |
| Throttler default preset | (ttl, limit) = (60_000, 100) / 더 엄격 / 더 관대 | **(60_000ms, 100req)** | 합리적 baseline. app 별 tuning 가능 |
| Throttler storage | in-memory / Redis adapter | **in-memory (default)** | 분산 환경 진입 전까지 충분. Redis 는 별 spec |
| catalog 버전 | helmet ^8.1.0 / @nestjs/throttler ^6.5.0 | 채택 | npm view 최신 안정. throttler v6 가 NestJS 11 peer 호환 |
| TDD Red 단계 typecheck | test commit 박지 않고 한 번에 / stub 박기 | **stub 박기** | pre-commit hook 가 typecheck 막음. stub fn (throw) 박으면 Red 유지 + typecheck 통과 |

### ADR 승격 가이드

- [x] **없음** — 본 spec 의 결정은 모두 *기존 ADR (0015 / 0016) 적용* + *표준 middleware preset*. ADR 격상 가치 없음.

## 💬 사용자 협의

| 시점 | 사용자 결정 |
|---|---|
| 다음 spec 옵션 (A / B / C) | **C: security → apps-api (추천)** — spec-03-07 backend-security 진입 |
| 패키지 레이아웃 (A / B / C) | **A: nestjs-security 단일 (추천)** |
| Rate-limit 라이브러리 | **@nestjs/throttler (추천)** |
| Plan Accept | 즉시 |

본 spec 진행 중 별도 사용자 협의 없음 (사전 합의된 작업).

## 🔁 진행 과정

### T1 — 브랜치 생성 (commit 없음)

- `git checkout -b spec-03-07-backend-security` (시작: `phase-03-backend-foundation`)

### T2 — catalog 갱신 (`9848c9a`)

- `pnpm-workspace.yaml` catalog 에 `helmet: ^8.1.0`, `@nestjs/throttler: ^6.5.0` 추가
- `pnpm install` 실행 — 본 commit 시점에는 어떤 패키지도 의존 안 함, lockfile 변경 없음
- 본 commit 에 spec-03-07 문서 (spec/plan/task) + backlog auto-update 동봉 (spec-03-06 패턴 답습)

### T3 — 패키지 scaffold (`4921bce`)

- `packages/nestjs/security/{package.json,tsconfig.json,vitest.config.ts,src/index.ts}` 생성
- `package.json` dependencies: `@nestjs/common`, `@nestjs/core` (APP_GUARD 위해), `@nestjs/throttler`, `helmet`, `reflect-metadata`
- `src/index.ts` 는 module docstring 만 (stub)
- `pnpm install` → 21 workspace projects 인식 + lockfile 갱신 (helmet 8.1.0 / throttler 6.5.0 install)

### T4 — applySecurity helper TDD (`29c250f` Red → `a13616e` Green)

**Red (`29c250f`)**:
- `src/index.test.ts` 작성 — 4 test (default opts / helmet false / cors false / cors forward)
- 초기 typecheck fail (applySecurity import 깨짐) — pre-commit hook 가 막음
- **stub 박기**: `SecurityOptions` interface + `applySecurity` body `throw new Error("not implemented")` → typecheck PASS + test 4/4 Red

**Green (`a13616e`)**:
- `applySecurity` 본체: `opts.helmet !== false` 분기 → `app.use(helmet(opts.helmet))`, `opts.cors !== false` 분기 → `app.enableCors(opts.cors)`
- test 4/4 ✓

### T5 — BackendThrottlerModule TDD (`f48a070` Red → `fb5cefb` Green)

**Red (`f48a070`)**:
- test 3 추가 (DynamicModule 구조 / APP_GUARD provider / 사용자 지정 ttl·limit)
- stub `@Module({}) class BackendThrottlerModule { static forRoot throws }` → typecheck PASS + throttler 3 test Red (applySecurity 4 test PASS 유지)

**Green (`fb5cefb`)**:
- `import { APP_GUARD } from "@nestjs/core"` + `import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler"`
- `BackendThrottlerModule.forRoot(opts)`:
  - `imports: [ThrottlerModule.forRoot([{ ttl, limit }])]`
  - `providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }]`
  - `exports: [ThrottlerModule]`, `global: true`
- default `ttl: 60_000`, `limit: 100`
- test 7/7 ✓ (applySecurity 4 + throttler 3)

### T6 — 통합 검증 (commit 없음)

- `pnpm lint` ✓ 14 tasks PASS
- `pnpm typecheck` ✓ 14 tasks FULL TURBO
- `pnpm test` ✓ 153 test PASS (nestjs-security 7 신규)
- `pnpm exec depcruise` ✔ 0 violations (67 modules / 102 deps)
- `./.harness-kit/bin/sdd test passed` → ship gate 통과

### T7 — Ship (본 commit)

- walkthrough + pr_description 작성
- ship commit + push + PR 생성

## 🧪 검증 결과

### 자동화 테스트

| 패키지 | test 수 | 상태 |
|---|:---:|:---:|
| `@repo/nestjs-security` (신규) | 7 | ✓ |
| 기타 13 패키지 (변경 없음) | 146 | ✓ |
| **합계** | **153** | **all green** |

### depcruise

```
✔ no dependency violations found (67 modules, 102 dependencies cruised)
```

이전 (PR #16 직후) 61 modules / 93 deps → +6 module / +9 dep (`@repo/nestjs-security` 추가분).

### 수동 검증

| 항목 | 명령 | 결과 |
|---|---|---|
| applySecurity export | `grep "export function applySecurity" packages/nestjs/security/src/index.ts` | 1 hit ✓ |
| BackendThrottlerModule export | `grep "export class BackendThrottlerModule" packages/nestjs/security/src/index.ts` | 1 hit ✓ |
| APP_GUARD 자동 등록 | `grep "APP_GUARD" packages/nestjs/security/src/index.ts` | 2 hit (import + provide) ✓ |

## 🔍 발견 사항

1. **TDD Red 와 pre-commit typecheck 충돌**: vanilla TDD 는 *test 작성 → import not found → fail* 패턴이지만, 본 repo 의 pre-commit hook 가 typecheck 를 막음. **해결**: Red commit 시점에 *stub function* (throw `not implemented`) 박아 typecheck 통과 + runtime 동작은 fail 유지. 후속 spec 도 동일 패턴 답습 가능.

2. **`@nestjs/throttler` v6 peer 호환**: NestJS 11 peer dep (`^7-^11`) 정상 — npm view 확인. 만약 v7 메이저 진입 시점 peer 재확인 필요.

3. **`APP_GUARD` 자동 등록 — 모든 라우트 영향**: `BackendThrottlerModule` 이 `providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }]` 박음 → import 만 해도 모든 라우트 자동 rate-limit. dev 가 ThrottlerGuard 등록 잊을 위험 0, 대신 *opt-out 책임* 은 사용자 (`@SkipThrottle()` decorator). apps/api health probe 같은 빈번 endpoint 충돌 시점 인지 필요.

4. **helmet 은 helper, throttler 는 Module — 비대칭의 자연성**: helmet 은 *`app.use()` 호출* 시점이 자연 (main.ts 부트), throttler 는 *DI provider + Guard* 가 자연 (모듈 등록). 같은 어댑터 패키지 안에서 두 패턴 공존이 *NestJS ecosystem 답습*. 강제로 통일하면 (helmet 도 Module 화) 오히려 어색.

5. **3-test 검증 한계 (`forRoot` 사용자 지정 ttl/limit)**: `ThrottlerModule.forRoot([{ ttl, limit }])` 의 내부 config 가 *ThrottlerModule 내부 closure* 라 외부 검증 어려움. 본 spec 에선 *imports 존재* 만 간접 검증. 통합 테스트 (`apps/api` 부트 + 실제 rate-limit hit) 시점에 본격 검증 가능.

6. **catalog 라인 추가 + 동시 패키지 dep 박기**: catalog 만 추가하고 어느 패키지도 안 쓰면 lockfile 변경 0 — Task 2 (catalog) 와 Task 3 (scaffold) 분리 의미 적음. 그러나 *commit 책임 분리* (chore catalog vs feat scaffold) 가 review 시 가독성 ↑ — 본 spec 은 의도적으로 분리.

7. **`backlog/phase-03.md` 본문 mismatch (이월)**: phase.md *작업 단위 (SPECs)* 단락이 *원래 계획* 그대로 (spec-03-05 observability / spec-03-06 backend-security / spec-03-07 apps-api-scaffold) — 실제 진행은 다름. 본 spec 안에서 정정 안 함 (scope ↑). phase ship 시점 또는 spec-03-08 진입 시점에 일괄 정정.

## 🚧 이월 항목

- **`apps/api` scaffold (spec-03-08 예정)**: 모든 5 어댑터 (`nestjs-settings/logger/http-client/database/security`) 통합 wire-up. Repository 패턴 실 예제 박음 (`health-check` 또는 simple User 도메인). `applySecurity` main.ts 1회 호출 + `BackendThrottlerModule.forRoot()` AppModule import 패턴 검증.
- **`phase-03.md` 본문 정정**: 작업 단위 (SPECs) 단락 + 성공 기준 + 통합 테스트 시나리오 mismatch 정정. phase ship 시점 또는 spec-03-08 에서 일괄.
- **Throttler Redis storage**: 분산 환경 진입 시점에 `@nestjs/throttler` storage adapter (`ThrottlerStorageRedisService` 등) 박는 별 spec.
- **`apps/api` health probe ↔ ThrottlerGuard 충돌 가능성**: 기본 100req/60s 가 health probe 빈도와 conflict 가능 — `@SkipThrottle()` 또는 per-app config tuning.
- **CSRF protection**: SPA + JWT 패턴 (현 가정) 에서는 불필요. cookie-based session 도입 시점에 별 spec.

## 📅 메타

| 항목 | 값 |
|---|---|
| **작성자** | Agent + dennis |
| **작성 기간** | 2026-05-19 |
| **commits** | 6 (T2 9848c9a + T3 4921bce + T4 29c250f / a13616e + T5 f48a070 / fb5cefb) + T7 ship (본 commit) |
| **test 수** | 7 신규 (`@repo/nestjs-security`) — 전체 153 PASS |
| **depcruise** | 0 violations (67 modules / 102 deps, +6 module / +9 dep) |
| **신규 패키지** | `@repo/nestjs-security` 1개 |
