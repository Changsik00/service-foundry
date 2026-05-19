# spec-03-02: `@repo/backend-logger` — pino + request-id + redaction + NestJS interceptor

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-03-02` |
| **Phase** | `phase-03` (Backend Foundation, Phase Base Branch 모드) |
| **Branch** | `spec-03-02-backend-logger` |
| **PR Target** | `phase-03-backend-foundation` |
| **상태** | Planning |
| **타입** | Feature |
| **Integration Test Required** | no |
| **작성일** | 2026-05-18 |
| **소유자** | dennis |

## 📋 배경 및 문제 정의

### 현재 상황

- phase-03 spec-03-01 완료. `@repo/backend-settings`가 박힘 — `BaseBackendSchema.LOG_LEVEL` (pino 6단계) 제공.
- catalog에 `pino: ^10.3.1` 박혀있음 (phase-01부터 locked).
- ARCHITECTURE.md §2.3 / locked stack memory: *"Logger: pino"*. NestJS interceptor adapter는 본 spec scope.
- pino *직접 사용*은 흔하나 *boilerplate 컨벤션*(request-id 자동 부여 / secret redaction / dev pretty / production JSON)이 박혀야 *모든 backend 패키지가 동일 로그 형식* 보장.

### 문제점

1. **`console.log` / `process.stdout.write` 직접 사용**: 구조화 안 됨 + redaction 안 됨 + level filter 안 됨 → production 로그 품질 저하.
2. **request-id 부재**: 분산 로그(여러 request 동시 처리)에서 *trace 어려움*. 표준 패턴: 각 HTTP request에 unique ID 부여 + 모든 로그에 *자동 포함*.
3. **secret redaction**: password / token / authorization header가 *로그에 그대로 박히면* 보안 사고. pino redaction API 활용.
4. **dev vs production 출력**: dev는 *human-readable* (pino-pretty), production은 *JSON line* (수집 시스템 연동) — 환경별 자동 전환 컨벤션 필요.
5. **NestJS 통합**: NestJS는 기본 `LoggerService` interface 제공 — pino를 *adapter로 wrap*해서 `Logger.error()` 같은 NestJS 어휘로 호출 가능해야 함.

### 해결 방안 (요약)

`packages/backend/logger` 신규 패키지 (`@repo/backend-logger`):

1. **pino 인스턴스 factory** — `createLogger(options)` — `BaseBackendSchema.LOG_LEVEL` 기반 level + dev pretty 자동 전환 + 기본 redaction paths.
2. **request-id middleware** — Node `crypto.randomUUID()` 또는 ULID로 unique ID 부여 + AsyncLocalStorage로 *함수 호출 context 통과* 없이 logger 접근 가능.
3. **NestJS LoggerService adapter** — `class PinoLoggerService implements LoggerService`로 NestJS의 *모든 log call*을 pino로 전달.
4. **NestJS module** — `BackendLoggerModule.forRoot({ level, redact?, transport? })` DynamicModule. spec-03-01 패턴 답습 (객체 리터럴 + symbol injection token).

## 📊 개념도

```mermaid
flowchart TB
    subgraph "@repo/backend-logger (신규)"
        CL[createLogger - pino factory]
        RM[requestIdMiddleware - AsyncLocalStorage]
        NS[PinoLoggerService - NestJS LoggerService impl]
        BLM[BackendLoggerModule.forRoot]
        DR[기본 redaction paths]
    end
    subgraph "외부 dep"
        PINO[pino]
        PP[pino-pretty - devDep / dynamic load]
        NJ["@nestjs/common LoggerService"]
    end
    subgraph "선행 (spec-03-01)"
        BS["@repo/backend-settings BaseBackendSchema.LOG_LEVEL"]
    end
    subgraph "후속 (spec-03-03~07)"
        HTTP[backend-http-client]
        DB[backend-database]
        OB[backend-observability]
        API[apps/api wire]
    end
    BS --> CL
    PINO --> CL
    PP --> CL
    CL --> NS
    NJ --> NS
    CL --> RM
    NS --> BLM
    RM --> BLM
    BLM --> HTTP
    BLM --> DB
    BLM --> OB
    BLM --> API
```

## 🎯 요구사항

### Functional Requirements

1. **`packages/backend/logger` 신규 패키지** (`@repo/backend-logger`):
   - scaffold (package.json / tsconfig.json (types: ["node"]) / vitest.config.ts) — spec-03-01 패턴 답습
   - `dependencies`: `pino: catalog:` + `@nestjs/common: catalog:` + `@repo/backend-settings: workspace:*`
   - `devDependencies`: 표준 + `@types/node: catalog:`
   - `pino-pretty`는 *peer / optional* — dev에서만 dynamic require, prod에서는 부재 가능

2. **`createLogger(options)` factory**:
   - 시그니처: `createLogger({ level, redact?, transport? }): pino.Logger`
   - `level`: `BaseBackendOutput["LOG_LEVEL"]` 호환 (pino 6단계)
   - `redact`: 기본 paths 자동 적용 (`password` / `token` / `authorization` / `cookie` / `secret` / `api_key` — case-insensitive 패턴)
   - `transport`: dev는 `pino-pretty` (dynamic load) / prod는 stdout JSON (기본)
   - 검증 실패 시 `AppError({ code: "INTERNAL" })` throw (ADR-0009 일관)

3. **request-id middleware + AsyncLocalStorage context**:
   - `requestIdMiddleware`: Express/Fastify 호환 middleware. `X-Request-Id` header 존재 시 사용, 없으면 `crypto.randomUUID()`.
   - `runWithRequestId(id, fn)`: AsyncLocalStorage로 context 통과 없이 *내부 함수에서 logger.child({ reqId })* 자동 사용 가능.
   - `getCurrentRequestId(): string | undefined` — context 외부에서는 undefined.

4. **`PinoLoggerService` (NestJS LoggerService impl)**:
   - `log` / `error` / `warn` / `debug` / `verbose` / `fatal` 6 method
   - context 인자 → pino `{ context }` field로
   - `getCurrentRequestId()` 자동 attach (값 있을 때만)

5. **`BackendLoggerModule.forRoot(options)` NestJS adapter**:
   - DynamicModule 객체 리터럴 (spec-03-01 패턴)
   - `BACKEND_LOGGER` symbol injection token
   - global module

6. **단위 테스트**: ~10 test 예상.

### Non-Functional Requirements

1. **`pino` + NestJS + `@repo/backend-settings` 외 런타임 의존성 0**.
2. **`pino-pretty`는 *optional* / dev에서만**: prod bundle에서 *제외 가능* — `try/catch dynamic import` 패턴.
3. **DOM lib 미포함** — backend Node-only.
4. **performance**: pino는 *zero-cost when disabled* — level 필터 작동 검증.
5. **redaction**: 기본 paths 6개 + 사용자 추가 가능.

## 🚫 Out of Scope

- **로그 수집 / 전송** (Datadog / Loki / CloudWatch) — phase-10 Ops에서.
- **OTel trace correlation** — phase-03 spec-03-05 (observability)에서 *trace_id + span_id 자동 attach*.
- **log sampling / rate-limit** — phase-09+ 운영 시점에 필요 시.
- **structured query syntax** (예: GraphQL log query) — out of scope.
- **frontend logger** — frontend는 별도 (phase-04+).
- **direct file logging** — pino transport로 stdout만 (수집은 외부 도구).

## 📑 ADR 후보

- [ ] ADR 가치 있는 결정 있음
- [x] **없음** — 본 spec은 *결정 적용*. pino 채택은 memory + ADR-0002에 박혀있음. NestJS adapter 패턴은 spec-03-01에서 박힌 패턴 반복 (객체 리터럴 + symbol token). 같은 패턴이 *3 spec 반복*되면 ADR 격상 후보 (phase-03 중후반).

## 🔍 Critique 결과 (선택)

미실행.

## ✅ Definition of Done

- [ ] `packages/backend/logger` 신규 패키지 scaffold
- [ ] `createLogger` + redaction + dev/prod transport 분기
- [ ] `requestIdMiddleware` + `runWithRequestId` + `getCurrentRequestId` AsyncLocalStorage 패턴
- [ ] `PinoLoggerService` NestJS LoggerService impl
- [ ] `BackendLoggerModule.forRoot()` DynamicModule
- [ ] `pnpm test` 그린 (~10 test 추가)
- [ ] `pnpm lint` / `pnpm typecheck` 그린
- [ ] depcruise violation 0건 유지
- [ ] `walkthrough.md` / `pr_description.md` ship commit
- [ ] `spec-03-02-backend-logger` 브랜치 push
- [ ] PR 생성 (base = `phase-03-backend-foundation`)
- [ ] 사용자 알림
