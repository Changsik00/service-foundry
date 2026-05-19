# Walkthrough: spec-03-02

> Phase 3 (Backend Foundation) 두 번째 spec. `@repo/backend-logger` — pino 기반 dev/prod 통합 logger + AsyncLocalStorage request-id context + NestJS LoggerService 어댑터. **spec-03-01 패턴 답습** (객체 리터럴 DynamicModule + symbol injection token).

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| Logger 라이브러리 | pino / winston / bunyan | **pino** | catalog locked (ADR-0002) + Node 진영 최고 성능 + JSON 기본 |
| Pretty printer | pino-pretty (devDep) / 직접 transformer | **pino-pretty (devDep)** | dev human-readable + prod bundle 제외 가능 (peerDependenciesMeta.optional: true) |
| Pretty 버전 | ^11.x (plan 추정) / ^13.x (실제 최신) | **^13.1.3** | T2 정찰: npm view pino-pretty version. plan은 *최신 pin* 의도. |
| request-id 생성 | crypto.randomUUID() / ULID / nanoid | **crypto.randomUUID()** | 외부 dep 0 + Node 표준. ULID 등은 *후속* 검토 (시간 정렬 필요 시) |
| context propagation | AsyncLocalStorage / 함수 인자 통과 / cls-hooked | **AsyncLocalStorage** | Node 16+ 표준 + 코드 침습 없음. cls-hooked는 deprecated |
| header 이름 | X-Request-Id / X-Correlation-Id / X-Trace-Id | **X-Request-Id** | 산업 표준 (Stripe / Heroku / Cloudflare 등) |
| header 매칭 | case-sensitive / case-insensitive | **case-insensitive** | HTTP header 표준은 case-insensitive — `toLowerCase()` 비교 |
| redaction 기본 paths | 0 / 6 / 14 (변형 포함) | **14** | password / token / authorization / cookie / secret / api_key + `*.<key>` + `headers.*` 변형 |
| redaction replacement | 기본 ("[Redacted]") / 커스텀 | **기본** | pino 디폴트 — 사용자 추가 paths만 받음 (제거는 막음 — *기본 = 안전 보장*) |
| `createLogger` destination 인자 | 노출 / 숨김 | **노출 (옵셔널 2nd 인자)** | test 캡처 + 후속 OTel transport 연계 — pino native 시그니처 일관 |
| NestJS verbose → pino | trace / debug / 자체 매핑 | **trace** | NestJS verbose는 *trace보다 더 자세* 의미 — pino trace가 자연 매핑 |
| `PinoLoggerService` reqId 주입 | 매 호출 child / root에 mixin | **매 호출 child** | reqId는 *호출 시점의 ALS context* — root는 stateless 유지 |
| `BackendLoggerModule` 구현 | NestJS @Module class / 객체 리터럴 (DynamicModule) | **객체 리터럴** | NestJS 직접 import 안 함 (spec-03-01 답습) — peer dep 비대 회피 |
| BACKEND_LOGGER token | symbol vs string | **symbol** | NestJS 권장 + 유일성 보장 (spec-03-01 답습) |
| global module | yes / no | **yes** | 모든 backend service에서 inject 가능해야 함 — global 적합 |
| ADR 시점 | 없음 | 채택 | 본 spec은 *결정 적용*. 객체-리터럴 DynamicModule 패턴이 *3 spec 반복* 시 ADR 격상 후보 (spec-03-04 또는 spec-03-06 시점) |

### ADR 승격 가이드

- [ ] ADR 가치 있는 결정 있음
- [x] **없음** — pino 채택은 memory + ADR-0002에 박혀있음. NestJS adapter 패턴은 spec-03-01의 *반복*. 3회 반복 시 ADR 격상 (현재 2회: settings + logger).

## 💬 사용자 협의

- **주제 1** — observability 도구 명확화: 사용자가 *"Logging trash 서버"* 도입 가능성을 질문 → 어시스턴트가 LGTM 스택 (Loki + Grafana + Tempo + Mimir) 제안. 사용자가 *"error 추적 - crash 리포팅 되어야 하고.. methods order, data 진행상황 이런거 알아야 함.."* 으로 3가지 도메인 (logs / traces / errors) 분리 제시.
- **주제 2** — 우선순위 명확화: 사용자가 *"sentry 는 내가 차후 라고 말한거고.. 운영 이슈라서.. 지금 우선시 해야 하는건 개발환경이야"* → Sentry는 phase-10 (또는 phase-05 신규 spec) 운영 영역으로 deferred. spec-03-02는 logs (pino + request-id) 만 책임, traces는 spec-03-05 OTel, errors는 후속 phase.
- **주제 3** — Plan Accept *"좋아.."* → T1~T7 Strict Loop 진행.

## 🔁 진행 과정

### T1 — 브랜치 생성

- `phase-03-backend-foundation` 에서 `spec-03-02-backend-logger` 브랜치 분기 (Phase Base Branch 모드).
- carried-over 변경: `backlog/phase-03.md` + `backlog/queue.md` (spec-03-02 진입 auto-update) — T2 commit에 통합.

### T2 — 패키지 scaffold + pino-pretty catalog

- **정찰**: `npm view pino-pretty version` → ^13.1.3 (plan 추정 ^11.x보다 최신). catalog에 ^13.1.3 박음.
- 패키지 scaffold (spec-03-01 패턴 답습):
  - `package.json` — deps: pino / @nestjs/common / @repo/backend-settings / @repo/errors / reflect-metadata
  - `peerDependenciesMeta.pino-pretty.optional: true` — prod bundle 제외 가능
  - `tsconfig.json` — experimentalDecorators + emitDecoratorMetadata + types: ["node"]
  - `vitest.config.ts` — `@repo/vitest-config/node` re-export
- `pnpm install` → 24 패키지 추가 (pino + pino-pretty + transitive).
- src/index.ts placeholder (`export {}`).
- Commit `6370fe2` — typecheck ✓.

### T3 — `createLogger` factory + redaction (TDD)

- **RED**: 3 test 작성 — level filter / redaction / pretty 옵션. test 3/3 fail (placeholder).
- **구현**:
  - `DEFAULT_REDACT_PATHS` 14개 — password / token / authorization / cookie / secret / api_key + `*.<key>` 변형 + `headers.<key>` 변형.
  - `createLogger({ level, redact?, pretty? }, destination?)` — destination 2nd 인자는 test 캡처용 (pino native 시그니처).
  - pretty=true → pino-pretty transport (colorize: true).
- **GREEN**: 3/3 ✓.
- Commit `5a3c66f`.

### T4 — AsyncLocalStorage request-id context (TDD)

- **RED**: 4 test 추가 — runWithRequestId 안/밖 / header 사용 / header 미존재 generate. 7 중 4 fail.
- **구현**:
  - `requestStore` (AsyncLocalStorage<RequestContext>) — 모듈 scope singleton.
  - `runWithRequestId(id, fn)` / `getCurrentRequestId()` / `generateRequestId()` (randomUUID).
  - `requestIdMiddleware({ header? })` — `req.headers[headerName.toLowerCase()]` 사용, 없으면 generate. Express/Fastify 호환 (req.headers / next() 만 의존, framework dep 0).
- **GREEN**: 7/7 ✓.
- Commit `424f2c3` (biome auto-format 적용).

### T5 — `PinoLoggerService` NestJS LoggerService 어댑터 (TDD)

- **RED**: 2 test 추가 — 6 method routing / runWithRequestId 안에서 reqId child 검증. 9 중 2 fail.
- **구현**:
  - `import type { LoggerService } from "@nestjs/common"` — type-only import (NestJS 런타임 dep 0).
  - 6 method: log→info / error→error / warn→warn / debug→debug / verbose→**trace** / fatal→fatal.
  - `withContext(context?)`: logger.child({ context?, reqId? }) — reqId 자동 attach (getCurrentRequestId() 있을 때만).
  - error(message, trace, context): pino `{ trace }` 객체로 wrap.
- **TC fail**: 첫 mock 구현이 `vi.fn` 반환 타입이 pino `child<ChildCustomLevels>` generic 신호와 호환 안 됨. 해결: plain function + `as unknown as Logger` cast.
- **GREEN**: 9/9 ✓.
- Commit `bd8ee2f`.

### T6 — `BackendLoggerModule.forRoot` DynamicModule (TDD)

- **RED**: 2 test 추가 — DynamicModule 구조 / 2 provider + exports 검증. 11 중 2 fail.
- **구현**:
  - `BACKEND_LOGGER = Symbol("BACKEND_LOGGER")` — pino Logger 인스턴스 직접 inject 용 (NestJS injectable class가 아닌 raw logger 필요 시).
  - `BackendLoggerModule.forRoot(options)` — 객체 리터럴 (spec-03-01 패턴 답습):
    - 1 `createLogger(options)` → pino root.
    - 1 `new PinoLoggerService(logger)` → 어댑터.
    - providers: 2 (BACKEND_LOGGER + PinoLoggerService), exports 동일, global: true.
- **GREEN**: 11/11 ✓.
- Commit `fe1c957`.

### T7 — Ship (본 commit)

- `pnpm lint` ✓ (7 tasks, full turbo).
- `pnpm typecheck` ✓ (FULL TURBO, 13 패키지).
- `pnpm test` ✓ (7 tasks, 11+ test).
- `pnpm exec depcruise --config packages/config/depcruise-config/base.cjs packages/` → **0 violations** (38 modules / 48 dependencies).

## 🧪 검증

```bash
pnpm --filter @repo/backend-logger test
# ✓ src/index.test.ts (11 tests) 8ms
#  Test Files  1 passed (1)
#       Tests  11 passed (11)
```

11 test 구성:
- createLogger: 3 (level / redaction / pretty)
- requestId context: 4 (runWithRequestId / getCurrentRequestId outside / header used / header missing generate)
- PinoLoggerService: 2 (6 method routing / reqId child binding)
- BackendLoggerModule: 2 (DynamicModule 구조 / 2 provider 노출)

## 🔍 발견 사항

1. **pino-pretty 버전 jump 1→13**: plan은 ^11.x 추정이었으나 정찰 결과 ^13.x. 라이브러리 메이저 jump가 잦은 영역 — catalog는 *정찰 시점 최신* 정책 유지.
2. **pino `child<ChildCustomLevels>` generic 시그니처 까다로움**: 단위 test mock이 `Partial<Logger>`로는 satisfies 안 됨. `unknown` cast로 해결. 후속 spec에서 pino 직접 mock 시 반복 발생 — utility 추출 검토 가능.
3. **biome 자동 포맷 ↔ 작성된 코드 일관성**: T4 commit 시 lefthook biome이 자동 format 적용 (줄바꿈 정리). 작성 스타일이 biome과 미세 차이 — 향후 *작성 시점부터 biome 스타일*로 박을 가치.
4. **AsyncLocalStorage 외 dep 0**: Express/Fastify 모두 호환 — middleware는 `req.headers` + `next()` 만 의존. framework 채택 시 *adapter 추가 없이* 즉시 사용 가능.
5. **observability 3-tool 도메인 분리 명확**: 사용자 협의에서 *logs (pino/Loki) ≠ traces (OTel/Tempo) ≠ errors (Sentry)* 합의. 본 spec은 logs만 책임. traces는 spec-03-05, errors는 후속 phase. 향후 *3 도메인 통합 wire-up*은 phase-03 spec-03-07 apps-api scaffold + phase-10 docker-compose에서.
6. **pino transport ↔ destination 차이**: `transport` (worker thread, pino-pretty 같은 자식 프로세스) vs `destination` (direct stream). test 캡처에는 destination, dev pretty에는 transport. createLogger 시그니처에서 둘 다 지원.

## ✅ Definition of Done

- [x] `packages/backend/logger` 신규 패키지 scaffold
- [x] `createLogger` + redaction + pretty option
- [x] `requestIdMiddleware` + `runWithRequestId` + `getCurrentRequestId` AsyncLocalStorage 패턴
- [x] `PinoLoggerService` NestJS LoggerService impl
- [x] `BackendLoggerModule.forRoot()` DynamicModule
- [x] `pnpm test` 그린 (11 test)
- [x] `pnpm lint` / `pnpm typecheck` 그린
- [x] depcruise violation 0건 (38 modules / 48 deps)
- [ ] PR 생성 (base = `phase-03-backend-foundation`) — sdd ship 후
