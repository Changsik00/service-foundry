# feat(spec-03-02): @repo/backend-logger — pino + AsyncLocalStorage request-id + NestJS LoggerService 어댑터

> Phase 3 (Backend Foundation) **두 번째 spec**. spec-03-01 패턴 답습 — 객체 리터럴 DynamicModule + symbol injection token.

## 📋 Summary

### 배경 및 목적

phase-03 spec-03-01 완료로 `@repo/backend-settings`의 `BaseBackendSchema.LOG_LEVEL` 박힘. 모든 backend 패키지가 *동일 로그 형식* 보장해야 함 — pino 직접 사용은 흔하나 *boilerplate 컨벤션* (request-id 자동 부여 / secret redaction / dev pretty / production JSON) 부재 시 패키지마다 보일러플레이트 중복.

본 spec은 `@repo/backend-logger` 신규 패키지 — pino 인스턴스 factory + AsyncLocalStorage request-id context + NestJS LoggerService 어댑터 + DynamicModule. **dev 디버깅 편의**를 1순위로 (사용자 명시: *"sentry 는 차후 / 지금 우선시 해야 하는건 개발환경"*). 운영 영역 (Sentry / 로그 수집) 은 phase-10 deferred.

### 주요 변경 사항

- [x] **`packages/backend/logger/` 신규 패키지** (`@repo/backend-logger`)
  - `createLogger({ level, redact?, pretty? }, destination?)` — pino factory + 14 default redact paths
  - `runWithRequestId` / `getCurrentRequestId` / `generateRequestId` (crypto.randomUUID) — AsyncLocalStorage 기반
  - `requestIdMiddleware({ header? })` — X-Request-Id (case-insensitive) Express/Fastify 호환
  - `PinoLoggerService` — NestJS `LoggerService` impl (6 method + reqId 자동 attach via child)
  - `BACKEND_LOGGER` symbol + `BackendLoggerModule.forRoot()` DynamicModule (global)
- [x] **catalog 추가**: `pino-pretty` ^13.1.3 (T2 정찰 최신)
- [x] **peerDependenciesMeta.pino-pretty.optional: true** — prod bundle 제외 가능

### Phase 컨텍스트

- **Phase**: `phase-03` Backend Foundation (Phase Base Branch 모드)
- **PR Target**: `phase-03-backend-foundation` (spec-03-01에서 박힌 phase branch)
- **본 SPEC의 역할**:
  - 후속 backend 패키지 (spec-03-03 http-client / 03-04 database / 03-05 observability / 03-07 apps/api) 가 *모두 본 패키지 inject 가능* — 일관된 로그
  - spec-03-05 observability (OTel) 가 *본 logger의 reqId* 와 trace_id 연계 (후속 spec)

## 🎯 Key Review Points

1. **dev 우선 원칙 — observability 3 도메인 분리**: 사용자 협의 후 *logs (본 spec) / traces (spec-03-05 OTel) / errors (phase-10 Sentry)* 분리 합의. 본 spec은 logs만 책임. 사용자 발화: *"sentry 는 내가 차후 라고 말한거고.. 운영 이슈라서.. 지금 우선시 해야 하는건 개발환경"*. → spec-03-02 scope 변경 없이 plan 그대로 진행.
2. **객체 리터럴 DynamicModule 패턴 — spec-03-01 답습 (2회째)**: NestJS `@Module` decorator class 대신 *객체 리터럴*. NestJS 런타임 dep 0 (type-only import). 동일 패턴 3 spec 반복 시 ADR 격상 후보 — 현재 2회 (settings + logger). spec-03-04/05/06 중 1회 더 반복 시 ADR-001X로 격상.
3. **AsyncLocalStorage + crypto.randomUUID — 외부 dep 0**: Node 표준 API만 사용. cls-hooked deprecated 회피 + ULID/nanoid 등 외부 dep 도입 보류 (필요 시 후속 spec). 함수 인자 통과 없이 컨텍스트 자동 전파 → NestJS controller / Drizzle query / undici call 모두 `getCurrentRequestId()` 호출만으로 reqId 얻음.
4. **DEFAULT_REDACT_PATHS 14개**: 6 기본 (password / token / authorization / cookie / secret / api_key) × 변형 (`<key>` / `*.<key>` / `headers.<key>`). pino redact API의 *deep path 매칭*. 사용자 추가 가능, 기본은 *제거 불가* (안전 기본값 보장 정책).
5. **pino-pretty optional + peerDependenciesMeta**: dev에서만 dynamic load. prod bundle 제외 가능 — `optional: true`로 peer missing 시 NPM 경고 없음. 본 spec test 에서는 pretty 옵션 throw-free 만 검증 (pretty output 직접 검증은 worker thread 의존 — 회피).
6. **NestJS verbose → pino trace 매핑**: NestJS `verbose`는 *trace보다 더 자세* 의미. pino 6단계 (trace/debug/info/warn/error/fatal)에 NestJS 6단계 (verbose/debug/log/warn/error/fatal) 매핑할 때 verbose가 *추가* 단계 (trace 위치). 결정: verbose → trace, log → info, 나머지 1:1.
7. **`createLogger` destination 2nd 인자 — test 캡처용 + 후속 transport 연계**: pino native 시그니처 일관 (`pino(opts, destination)`). dev에서는 undefined → stdout, test에서는 Writable stream 주입해 캡처, 후속 spec-03-05에서 OTel transport stream 주입 가능.
8. **`PinoLoggerService` mock typing 까다로움**: pino `child<ChildCustomLevels>` generic. `vi.fn` typed return이 satisfies 안 됨 → plain function + `as unknown as Logger` cast. 후속 spec에서 pino mock 반복 시 utility 추출 검토 (walkthrough §발견 사항 #2).
9. **AsyncLocalStorage 외 framework dep 0**: middleware 시그니처는 `req.headers` + `next()` 만 의존. Express/Fastify/Hono 모두 호환. NestJS adapter 추가 없이 즉시 사용 가능.
10. **pino-pretty 버전 jump 1→13 (catalog 정찰 정책)**: plan은 ^11.x 추정이었으나 정찰 결과 ^13.x. *정찰 시점 최신* 정책 유지 (semver major jump는 자주 발생하는 영역). 후속 maintain: pnpm catalog 한 곳만 갱신.

## 🧪 Verification

### 자동 테스트

```bash
pnpm install && pnpm lint && pnpm typecheck && pnpm test
pnpm exec depcruise --config packages/config/depcruise-config/base.cjs packages/
```

**결과 요약**:
- ✅ `pnpm install`: engines warning 외 0 warning
- ✅ `pnpm lint`: Biome PASS (7 패키지 turbo)
- ✅ `pnpm typecheck`: FULL TURBO cache hit (13 패키지)
- ✅ `pnpm test`: **11 test PASS in @repo/backend-logger** (전체 124+ PASS — settings 8 + 기존 + logger 11)
- ✅ `depcruise`: **0 violations** (38 modules / 48 dependencies)

### test 분포 (11 / spec-03-02)

| describe | test count | 검증 항목 |
|---|:---:|---|
| `createLogger` | 3 | level filter (debug↔info) / default redaction (password + headers.authorization) / pretty 옵션 throw-free |
| `requestId context` | 4 | runWithRequestId 안 / 밖 undefined / X-Request-Id header 사용 / header 미존재 generate (UUID 패턴) |
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
- **선행 spec**: spec-03-01 (`BaseBackendSchema.LOG_LEVEL` workspace dep)
- **후속 spec**: spec-03-05 backend-observability (OTel SDK + trace_id ↔ reqId 연계)
- **ADR**: 없음 (본 spec은 결정 적용). 3 spec 반복 후 *DynamicModule 객체 리터럴 패턴* ADR 격상 검토.

## 📝 Post-Merge

- [ ] Merge → `phase-03-backend-foundation` branch (Phase Base Branch 모드)
- [ ] Auto-sync: `backlog/phase-03.md` / `backlog/queue.md` (spec-03-02 → Merged)
- [ ] 사용자 알림: `머지 완료` 신호 후 후속 sync commit + 다음 spec (`spec-03-03 http-client`) 진입 옵션 제시
