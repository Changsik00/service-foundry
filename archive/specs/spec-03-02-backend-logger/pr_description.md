# feat(spec-03-02): @repo/backend-logger (pure) + @repo/backend-logger-nestjs (어댑터) — platform-agnostic

> Phase 3 (Backend Foundation) **두 번째 spec**. **2 패키지** — pure logger + NestJS 어댑터 별도 분리 (platform-agnostic 원칙).

## 📋 Summary

### 배경 및 목적

phase-03 spec-03-01 완료로 `@repo/backend-settings`의 `BaseBackendSchema.LOG_LEVEL` 박힘. 모든 backend 패키지가 *동일 로그 형식* 보장해야 함 — pino 직접 사용은 흔하나 *boilerplate 컨벤션* (request-id 자동 부여 / secret redaction / dev pretty / production JSON) 부재 시 패키지마다 보일러플레이트 중복.

본 spec은 **2 패키지**:
- `@repo/backend-logger` (pure, framework-agnostic) — pino factory + AsyncLocalStorage request-id context + middleware
- `@repo/backend-logger-nestjs` (NestJS 어댑터) — `PinoLoggerService` + `BackendLoggerModule`

**dev 디버깅 편의**를 1순위로 (사용자 명시: *"sentry 는 차후 / 지금 우선시 해야 하는건 개발환경"*). 운영 영역 (Sentry / 로그 수집) 은 phase-10 deferred.

### 🚨 중요 정정 (2026-05-19)

PR #10 1차 push 후 사용자 review catch — *"packages 에서는 어느 플렛폼에 붙을지는 몰라.. 따라서 이런 연관성은 배제 해야 해"*. 본래 한 패키지 안에 NestJS 어댑터(`PinoLoggerService` / `BackendLoggerModule` / `@nestjs/common` dep)가 박혔으나 **platform-agnostic 원칙 위반** → 본 spec scope 확장하여 **pure + 어댑터 2 패키지로 분리** + memory `feedback_platform_agnostic_packages` 박음.

같은 결함이 **spec-03-01의 `BackendSettingsModule`에도 존재** → phase-03 안에서 후속 spec으로 정정 예정 (settings-nestjs 분리).

### 주요 변경 사항

- [x] **`packages/backend/logger/` 신규 패키지** (`@repo/backend-logger`, **pure**)
  - `createLogger({ level, redact?, pretty? }, destination?)` — pino factory + 14 default redact paths
  - `runWithRequestId` / `getCurrentRequestId` / `generateRequestId` (crypto.randomUUID) — AsyncLocalStorage 기반
  - `requestIdMiddleware({ header? })` — X-Request-Id (case-insensitive) Express/Fastify/Hono 호환
  - `Logger` 타입 재export (pino 그대로) — 어댑터 패키지 편의
  - **deps: pino 만** (framework dep 0)
- [x] **`packages/backend/logger-nestjs/` 신규 어댑터 패키지** (`@repo/backend-logger-nestjs`)
  - `PinoLoggerService` — NestJS `LoggerService` impl (6 method + reqId 자동 attach via child)
  - `BACKEND_LOGGER` symbol + `BackendLoggerModule.forRoot()` DynamicModule (global)
  - deps: `@nestjs/common` + `@repo/backend-logger` (workspace) + `pino` + `reflect-metadata`
- [x] **catalog 추가**: `pino-pretty` ^13.1.3 (T2 정찰 최신)
- [x] **peerDependenciesMeta.pino-pretty.optional: true** — prod bundle 제외 가능

### Phase 컨텍스트

- **Phase**: `phase-03` Backend Foundation (Phase Base Branch 모드)
- **PR Target**: `phase-03-backend-foundation` (spec-03-01에서 박힌 phase branch)
- **본 SPEC의 역할**:
  - 후속 backend 패키지 (spec-03-03 http-client / 03-04 database / 03-05 observability / 03-07 apps/api) 가 *모두 본 패키지 inject 가능* — 일관된 로그
  - spec-03-05 observability (OTel) 가 *본 logger의 reqId* 와 trace_id 연계 (후속 spec)

## 🎯 Key Review Points

1. **🚨 Platform-agnostic 분리 — 본 PR의 핵심**: 1차 push에서는 spec-03-01 패턴 답습으로 *한 패키지 안에 NestJS 어댑터* 박았으나 사용자 review catch — *"packages 에서는 어느 플렛폼에 붙을지는 몰라"*. 옵션 A 채택 (옵션 B/C는 [walkthrough](specs/spec-03-02-backend-logger/walkthrough.md) §사용자 협의 주제 4 참조): pure 패키지 + 어댑터 패키지 분리. **`@repo/backend-logger`는 framework dep 0** (pino만). **`@repo/backend-logger-nestjs`는 어댑터 패키지** (NestJS dep + workspace pure logger). memory `feedback_platform_agnostic_packages` 박음 — 후속 spec 모두에 적용.
2. **spec-03-01 정정 필요 (phase-03 내 후속 spec)**: 동일 결함이 `BackendSettingsModule`에 존재. 사용자 합의: 본 phase 안에서 정정 spec 추가 (`settings-nestjs` 분리). 본 PR 머지 후 진입 예정.
3. **dev 우선 원칙 — observability 3 도메인 분리**: 사용자 협의 후 *logs (본 spec) / traces (spec-03-05 OTel) / errors (phase-10 Sentry)* 분리 합의. 본 spec은 logs만 책임. 사용자 발화: *"sentry 는 내가 차후 라고 말한거고.. 운영 이슈라서.. 지금 우선시 해야 하는건 개발환경"*.
4. **AsyncLocalStorage + crypto.randomUUID — 외부 dep 0**: Node 표준 API만 사용. cls-hooked deprecated 회피 + ULID/nanoid 등 외부 dep 도입 보류 (필요 시 후속 spec). 함수 인자 통과 없이 컨텍스트 자동 전파 → 어떤 framework controller / query / http call 도 `getCurrentRequestId()` 호출만으로 reqId 얻음.
5. **DEFAULT_REDACT_PATHS 14개**: 6 기본 (password / token / authorization / cookie / secret / api_key) × 변형 (`<key>` / `*.<key>` / `headers.<key>`). pino redact API의 *deep path 매칭*. 사용자 추가 가능, 기본은 *제거 불가* (안전 기본값 보장 정책).
6. **pino-pretty optional + peerDependenciesMeta**: dev에서만 dynamic load. prod bundle 제외 가능 — `optional: true`로 peer missing 시 NPM 경고 없음. test 에서는 pretty 옵션 throw-free 만 검증 (pretty output 직접 검증은 worker thread 의존 — 회피).
7. **NestJS verbose → pino trace 매핑** (어댑터 패키지): NestJS `verbose`는 *trace보다 더 자세* 의미. pino 6단계 (trace/debug/info/warn/error/fatal)에 NestJS 6단계 (verbose/debug/log/warn/error/fatal) 매핑할 때 verbose가 *추가* 단계. 결정: verbose → trace, log → info.
8. **`createLogger` destination 2nd 인자 — test 캡처 + 후속 transport 연계**: pino native 시그니처 일관 (`pino(opts, destination)`). dev에서 undefined → stdout, test에서 Writable stream 주입, 후속 spec-03-05에서 OTel transport stream 주입 가능.
9. **어댑터 → pure 단방향 의존 (depcruise 보장)**: `@repo/backend-logger-nestjs` deps에 `@repo/backend-logger: workspace:*`. 역방향 (pure → nestjs)은 *deps에 NestJS 없으니 컴파일 불가* — 정적으로 platform-agnostic 깨지지 않음 보장.
10. **pino-pretty 버전 jump 1→13 (catalog 정찰 정책)**: plan은 ^11.x 추정이었으나 정찰 결과 ^13.x. *정찰 시점 최신* 정책 유지 (semver major jump는 자주 발생하는 영역). 후속 maintain: pnpm catalog 한 곳만 갱신.

## 🧪 Verification

### 자동 테스트

```bash
pnpm install && pnpm lint && pnpm typecheck && pnpm test
pnpm exec depcruise --config packages/config/depcruise-config/base.cjs packages/
```

**결과 요약**:
- ✅ `pnpm install`: engines warning 외 0 warning
- ✅ `pnpm lint`: Biome PASS (8 패키지 turbo)
- ✅ `pnpm typecheck`: PASS (14 패키지)
- ✅ `pnpm test`: **11 test PASS** (logger 7 + logger-nestjs 4)
- ✅ `depcruise`: **0 violations** (41 modules / 53 dependencies)

### test 분포 (11)

**`@repo/backend-logger` (7 test)**:

| describe | test count | 검증 항목 |
|---|:---:|---|
| `createLogger` | 3 | level filter (debug↔info) / default redaction (password + headers.authorization) / pretty 옵션 throw-free |
| `requestId context` | 4 | runWithRequestId 안 / 밖 undefined / X-Request-Id header 사용 / header 미존재 generate (UUID 패턴) |

**`@repo/backend-logger-nestjs` (4 test)**:

| describe | test count | 검증 항목 |
|---|:---:|---|
| `PinoLoggerService` | 2 | 6 method routing (info/error/warn/debug/trace/fatal) / runWithRequestId 안에서 reqId child binding |
| `BackendLoggerModule` | 2 | DynamicModule 구조 / 2 provider + exports + PinoLoggerService 인스턴스 |

### 수동 검증 (PR review 권장)

```bash
# 1. redaction 동작
cd packages/backend/logger && node -e "
import('./src/index.js').then(({createLogger}) => {
  const log = createLogger({ level: 'info' });
  log.info({ password: 'secret123', user: 'alice' });
});"
# → password 값 "[Redacted]"

# 2. AsyncLocalStorage 전파
node -e "
import('./src/index.js').then(({runWithRequestId, getCurrentRequestId}) => {
  runWithRequestId('abc-123', () => {
    setTimeout(() => console.log(getCurrentRequestId()), 10);
  });
});"
# → "abc-123" (async 경계 통과)
```

## 🔗 참조

- **walkthrough**: `specs/spec-03-02-backend-logger/walkthrough.md`
- **plan**: `specs/spec-03-02-backend-logger/plan.md`
- **spec**: `specs/spec-03-02-backend-logger/spec.md`
- **phase**: `backlog/phase-03.md`
- **선행 spec**: spec-03-01 (현재 패턴 정정 필요 — phase-03 내 후속 spec)
- **후속 spec (즉시)**: `@repo/backend-settings` platform-split (settings-nestjs 어댑터 분리)
- **후속 spec (phase-03 잔여)**: spec-03-03 http-client / spec-03-04 database / spec-03-05 observability (OTel + trace_id ↔ reqId 연계) / spec-03-06 security / spec-03-07 apps-api
- **memory**: `feedback_platform_agnostic_packages` (본 PR에서 박음)
- **ADR**: 없음 (현재는 memory). 후속 backend 패키지 모두 동일 패턴 적용 후 *ADR-001X platform-agnostic backend packages* 격상 검토.

## 📝 Post-Merge

- [ ] Merge → `phase-03-backend-foundation` branch (Phase Base Branch 모드)
- [ ] Auto-sync: `backlog/phase-03.md` / `backlog/queue.md` (spec-03-02 → Merged)
- [ ] 사용자 알림: `머지 완료` 신호 후 후속 sync commit + 다음 spec (`spec-03-03 http-client`) 진입 옵션 제시
