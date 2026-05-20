# Walkthrough: spec-03-04

> phase-03 4번째 spec. ADR-0015 패턴 3회째 적용 — pure (`@repo/backend-http-client`) + 어댑터 (`@repo/nestjs-http-client`) 2 패키지. undici 기반 + retry/timeout/typed/reqId propagation + zod schema validation.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| HTTP 라이브러리 | undici / axios / got / ky | **undici** | ADR-0002 catalog locked / Fetch API 호환 / Node 진영 최고 성능 |
| undici primitive | `fetch()` (전역) / `request()` (저수준) / `Pool` 직접 | **`fetch()` + global dispatcher** | Fetch API 익숙 + MockAgent global 설정 호환 + 코드 간결 |
| MockAgent test 패턴 | nock / MSW / undici 내장 MockAgent | **undici MockAgent** | 외부 dep 0 + undici native + setGlobalDispatcher로 한 번에 wire |
| retry idempotent 룰 | 전체 method retry / GET만 / RFC 9110 idempotent set | **GET/PUT/DELETE/HEAD default + POST/PATCH는 명시 시만** | RFC 9110 idempotent semantics. POST retry는 *결제 중복* 같은 사고 — 명시적 opt-in |
| backoff | linear / exponential / fibonacci | **exponential (`base * 2^attempt`)** | 표준 패턴, 단순 |
| timeout 구현 | undici timeout 옵션 / AbortController | **AbortController** | Node 표준 + 명시적 control + per-request override 쉬움 |
| AbortError 감지 | instanceof DOMException / name check / undici Error class | **name === "AbortError"** | undici/Node 통합 — duck typing이 가장 안전 |
| reqId attach 위치 | request 시점 (per call) / client 생성 시점 (per instance) | **per call** | AsyncLocalStorage가 호출 시점 컨텍스트라 자연. ALS instance 재사용 (별도 안 만듦) |
| reqId header 이름 | X-Request-Id / X-Correlation-Id / Traceparent (W3C) | **x-request-id (소문자)** | spec-03-02 inbound 패턴과 일관 (case-insensitive HTTP header) |
| schema validation 시점 | response body parse 후 / 별 메서드 | **request return 직전** | 한 호출에 schema 인자 — 호출 측 코드 깔끔 |
| schema 실패 statusCode | 4xx (client 잘못) / 5xx (upstream 잘못) | **502 (BAD_GATEWAY)** | upstream 응답이 contract 위반 — 우리 client 잘못 아님 |
| AppError 코드 추가 | 기존 STANDARD_ERROR_REGISTRY 사용 / 자유 코드 | **자유 코드** (NETWORK / TIMEOUT / UPSTREAM / BAD_REQUEST + VALIDATION 표준) | ADR-0009 AppError 자유 code 허용 — 도메인별 적합 |
| HttpRequestOptions generic | unknown (default) / T schema 매핑 | **`<TOutput = unknown>` generic** | schema 타입과 return 타입 일관 |
| body 조건 spread | `body: undefined` / 조건부 spread | **조건부 spread** (`...(body !== undefined && {body})`) | exactOptionalPropertyTypes: true 호환 |
| 어댑터 패턴 | ADR-0015 일관 | **객체 리터럴 DynamicModule + symbol token** | 3회 반복 (settings/logger/http-client) — ADR 격상 후보 |

### ADR 승격 가이드

- [x] ADR 승격 대상 있음 → **부분 후보**: AsyncLocalStorage reqId propagation 패턴 (logger 외 http-client 적용) → database / observability 진입 시 1회 더 반복 시 ADR 격상.
- [x] **객체 리터럴 DynamicModule 패턴** 4회 (settings / settings-nestjs / logger-nestjs / http-client-nestjs) — ADR 격상 즉시 후보. Icebox 추가.

## 💬 사용자 협의

- **주제 1 (slug 검토)**: 사용자 *"http-client 이 이름이 좋아? 그냥 내가 예시로 던진 말인데"* → 4 후보 비교 (suffix / NPM 컨벤션 / 영문법 / 다른 backend 패키지 일관성) → **`http-client` 유지** 합의 (다른 backend 패키지와 *단순 기능 명사* 톤 일관 + NPM 표준 `axios` / `got` / `ky` 라이브러리 이름 패턴 / suffix 통한 확장성: graphql-client / rpc-client).
- **주제 2 (plan accept)**: 5 후보 검토 후 *"좋아 go"* → Strict Loop 진입.

## 🔁 진행 과정

### T1 — 브랜치 생성

- `git checkout -b spec-03-04-backend-http-client` (시작: `phase-03-backend-foundation`)
- carry-over: sdd auto-update backlog/* — T2 commit에 통합

### T2 — scaffold + undici 정찰 (`3b074af`)

- **정찰**: `pnpm-workspace.yaml` catalog에 undici 없음 → ^8.3.0 추가 (npm view 최신)
- `packages/backend/http-client/` scaffold (spec-03-02 패턴 답습):
  - deps: undici + @repo/backend-logger (workspace) + @repo/errors (workspace) + zod
  - tsconfig: types: ["node"] (DOM 미포함, decorators 없음 — pure)
- undici API 검증: MockAgent / fetch / request / setGlobalDispatcher / Agent / Pool / Dispatcher 모두 export
- placeholder + typecheck ✓

### T3 — `createHttpClient` factory (TDD, `c5c475f`)

- **RED**: 3 test 작성 (baseUrl / default headers / 기본 GET)
- **구현**:
  - 타입: HttpMethod / CreateHttpClientOptions / HttpRequestOptions / HttpClient
  - createHttpClient → request<T>(opts) factory + get/post/put/delete/patch shortcut
  - default headers: content-type + accept JSON
  - body 조건 spread (exactOptionalPropertyTypes 호환)
- **GREEN**: 3/3 ✓
- typecheck 1차 fail (body undefined) → 수정 후 OK

### T4 — retry policy + timeout (TDD, `5344a93`)

- **RED**: 5 test 추가 (retry 5xx / network / max retries 초과 / timeout 정상 / timeout 시 AppError)
- **구현**:
  - IDEMPOTENT_METHODS set (GET/PUT/DELETE/HEAD) — POST/PATCH는 명시 시만 retry
  - exponential backoff (baseBackoff * 2^attempt)
  - for-loop attempt — 5xx + network error 시 retry
  - AbortController + setTimeout → AbortError 감지 → AppError TIMEOUT (504)
  - 5xx (after retry) → AppError UPSTREAM (원본 status 보존)
  - 4xx → AppError BAD_REQUEST (원본 status 보존)
  - network → AppError NETWORK (statusCode 0, cause: 원본)
- **GREEN**: 8/8 ✓

### T5 — reqId propagation + schema validation (TDD, `8560847`)

- **RED**: 3 test 추가 (runWithRequestId 안/밖 / schema 통과+실패)
- **구현**:
  - `getCurrentRequestId()` (from @repo/backend-logger) 호출 → 있으면 outbound x-request-id header
  - HttpRequestOptions<TOutput> generic 화 + schema?: ZodType<TOutput>
  - response body가 schema.safeParse → 성공 시 parsed.data return, 실패 시 AppError VALIDATION (502)
- **GREEN**: 11/11 ✓

### T6 — `@repo/nestjs-http-client` 어댑터 (`5d4a77a`)

- `packages/nestjs/http-client/` 신규 (ADR-0015 패턴 3회째)
- deps: @nestjs/common + @repo/backend-http-client (workspace) + reflect-metadata
- src/index.ts: HTTP_CLIENT symbol + HttpClientModule.forRoot(options) DynamicModule (객체 리터럴, global)
- src/index.test.ts: 1 test (DynamicModule 구조 + HTTP_CLIENT provider)
- 검증: 1/1 ✓

### T7 — Ship (본 commit)

- 전체 검증: lint ✓ / typecheck ✓ FULL TURBO / test 12 ✓ / depcruise 0 violations (51 modules / 74 deps)
- walkthrough + pr_description 작성
- sdd ship + push + PR

## 🧪 검증 결과

### 자동화 테스트

| 패키지 | test 수 | describe |
|---|:---:|---|
| `@repo/backend-http-client` (pure) | 11 | createHttpClient (3) + retry policy (3) + timeout (2) + X-Request-Id propagation (2) + schema validation (1) |
| `@repo/nestjs-http-client` (어댑터) | 1 | HttpClientModule (1) |
| **합계** | **12** | — |

### depcruise

```
✔ no dependency violations found (51 modules, 74 dependencies cruised)
```

ADR-0015 룰 4개 모두 통과:
- `backend-no-nestjs-imports` ✓
- `frontend-no-react-adapter-imports` ✓
- `nestjs-no-frontend-imports` ✓
- `react-no-backend-imports` ✓

### 수동 검증

```ts
// X-Request-Id propagation 실 사용 예
import { runWithRequestId } from "@repo/backend-logger";
import { createHttpClient } from "@repo/backend-http-client";

const client = createHttpClient({ baseUrl: "https://example.com" });
await runWithRequestId("abc-123", async () => {
  await client.get("/api/test"); // outbound: x-request-id: abc-123
});
```

## 🔍 발견 사항

1. **undici MockAgent + setGlobalDispatcher 패턴 우수**: 외부 dep 0으로 단위 test 풍부. `disableNetConnect()` 로 실제 네트워크 호출 차단 — *test가 우연히 외부 호출하지 않음* 정적 보장.
2. **`replyWithError(error).times(n)` 패턴**: MockAgent가 network error 시뮬레이션 지원. retry policy test가 *real-world-like*.
3. **`exactOptionalPropertyTypes: true` 가 body 옵셔널에 주는 영향**: `body: undefined` 직접 전달 불가 → 조건부 spread. *작은 패턴이지만 backend 패키지에서 자주 반복* — 향후 utility helper 검토 가치.
4. **AsyncLocalStorage 일관성**: spec-03-02에서 박은 `runWithRequestId` / `getCurrentRequestId` 가 http-client에서 *자연스럽게 재사용*. 별도 ALS instance 만들지 않음 — *한 backend service의 한 reqId* 컨텍스트 일관.
5. **HttpRequestOptions generic `<TOutput = unknown>`**: schema 인자 있을 때 return 타입이 자동 추론 (`z.infer<typeof schema>`). 사용자 코드에서 *수동 generic 박을 필요 0*. zod의 타입 추론 + TS generic 조합.
6. **5xx UPSTREAM vs 4xx BAD_REQUEST 구분**: retry 정책이 다름 (5xx는 retry, 4xx는 immediate fail) — error code도 분리. ADR-0009 자유 code 정책 덕분에 *도메인별 명확*.
7. **schema validation을 502 (BAD_GATEWAY)로 매핑**: upstream 응답이 contract 위반은 *upstream 문제*. 우리 client 입장에서 *받을 데이터를 못 받은 것* — 5xx 카테고리 적합.
8. **객체 리터럴 DynamicModule 패턴 4회 반복**: settings / settings-nestjs / logger-nestjs / http-client-nestjs — *동일 구조*. ADR 격상 즉시 후보 (Icebox 추가 예정).

## 🚧 이월 항목

- **circuit breaker**: retry로 대부분 케이스 커버. 본 spec scope 밖 — 후속 spec 또는 운영 phase.
- **streaming (SSE / chunked transfer)**: 본 spec scope 밖.
- **GraphQL client**: 별 패키지 `backend-graphql-client` (가설).
- **frontend http-client**: 별 패키지 (phase-04+) — undici Node-only이라 별도 어댑터 필요.
- **ADR 후보**: AsyncLocalStorage reqId propagation 패턴 + 객체 리터럴 DynamicModule 패턴 → Icebox에 추가.

## 📅 메타

| 항목 | 값 |
|---|---|
| **작성자** | Agent + dennis |
| **작성 기간** | 2026-05-19 |
| **commits** | 5 (T2 3b074af + T3 c5c475f + T4 5344a93 + T5 8560847 + T6 5d4a77a) + T7 ship (본 commit) |
| **test 수** | 12 (backend 11 + nestjs 1) |
| **depcruise** | 0 violations (51 modules / 74 deps) |
