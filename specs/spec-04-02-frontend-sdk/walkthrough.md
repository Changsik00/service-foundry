# Walkthrough: spec-04-02 frontend-sdk

> phase-04 두 번째 spec. `@repo/frontend-sdk` 신설 — **ky** 기반 typed API client + AppError 변환 layer + explicit zod schema. NeoAuth `auth-http` 코드 리뷰 후 *형편없는 점 정정* (타입 안전성 / Error subclass / factory pattern / retry 옵션 노출).

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| fetch 라이브러리 | A globalThis.fetch wrapper / B ky / C axios | **B ky `^2.x`** | NeoAuth 답습 + maintained + 3KB gzip. axios 는 fetch 기반 아님 — 사용자 의도 (fetch 기반) 불부합 |
| client 패턴 | factory / class / hooks | **factory** (`createSdk`) | NeoAuth 의 *module-level side effect* (`new HttpClient(env)`) 정정. Server/Client Component 모두 자연 |
| API surface | ky chain 노출 / backend-http-client 답습 | **backend 답습** (`request/get/post/...`) | monorepo 일관 + 학습 비용 ↓ |
| error 변환 | ky HTTPError 그대로 / AppError 변환 | **AppError 변환 layer** | NeoAuth 의 *plain object throw* 정정. 표준 Error subclass |
| error codes | 자체 / @repo/errors 답습 | **@repo/errors 5 codes** | backend-http-client 와 일관 (NETWORK / TIMEOUT / UPSTREAM / BAD_REQUEST / VALIDATION) |
| contracts 바인딩 | explicit / contracts-defined / mixed | **explicit** (`schema?: ZodType<T>`) | 호출자가 `@repo/contracts` schema 명시 import — 가장 간단, 확장 자유 |
| retry methods default | 모든 method / idempotent only | **idempotent only** (`['get', 'put', 'delete', 'head', 'options', 'trace']`) | backend-http-client 정책 답습 — POST/PATCH 는 opts.retries 박힌 경우만 retry |
| retry status codes | ky default / 명시 | **명시 `[408, 413, 429, 500, 502, 503, 504]`** | 5xx + rate-limit + payload-too-large |
| `prefix` vs `baseUrl` (ky 2.x) | prefix / baseUrl | **baseUrl** | ky 2.x 의 web 표준 권장 |
| AppError statusCode | required (`@repo/errors` 컨벤션) | TIMEOUT: 504 / NETWORK: 0 / VALIDATION: 502 (backend-http-client 답습) | AppErrorInput.statusCode required — backend 패턴 답습 |
| snake_case 변환 | SDK / 호출자 정책 | **호출자 정책** | NeoAuth 가 SDK 안 안 박았으나 *호출자가 매번 toSnakeCaseKeyObject* — boilerplate. 우리는 *명시적으로 SDK 밖* — 도메인 영역 |
| `.result` unwrap | SDK / 호출자 정책 | **호출자 정책** | NeoAuth 가 *호출자에게 강제* — SDK 단순 유지 |
| commit 단위 | task별 1 | **3 commit** (scaffold + Red + Green) | TDD Red/Green 분리, revert 단위 명확 |

### ADR 승격 가이드

- [x] **없음** — ADR-0009 (AppError) + ADR-0015 (framework-adapter naming) 답습. 신규 ADR 가치 없음.

## 💬 사용자 협의

| 시점 | 사용자 결정 |
|---|---|
| spec-04-02 진입 시점 | "spec-04-02 진입하자" |
| fetch 라이브러리 (초기) | globalThis.fetch wrapper (직접 박음) |
| **NeoAuth 코드 리뷰 후 재결정** | "ky 추천 — axios vs ky" — Agent 의 NeoAuth 평가 + ky 채택 추천 → 사용자 **A: ky 채택** |
| client 패턴 | factory |
| error | @repo/errors AppError 답습 |
| contracts 바인딩 | explicit |
| **web-next vs web-vite 차이 질문** | Agent 가 비교표 박음 (SSR Hybrid vs SPA, 렌더 시점, deploy 등) |
| Plan Accept | 즉시 |

핵심 협의: **NeoAuth `auth-http` 코드를 사용자가 참고로 제시** → Agent 의 평가 (좋은 점: ky 채택 / 형편없는 점: 타입안전성 / Error class / module-level side effect / fixed retry / boilerplate). 사용자 *"답이 아니야 — 너가 어떻게 만들지 궁금"* → **ky 채택 + 형편없는 점 모두 정정** 채택.

## 🔁 진행 과정

### T1 — 브랜치 생성 (commit 없음)

- `git checkout -b spec-04-02-frontend-sdk` (시작: `phase-04-frontend-foundation`)

### T2 — catalog ky + scaffold (`6df600e`)

- `pnpm-workspace.yaml` catalog 에 `ky: ^2.0.2` 추가
- `packages/frontend/sdk/{package.json, tsconfig.json, vitest.config.ts, src/index.ts}` 박음
  - deps: `@repo/errors` + `ky`
  - peer: `zod ^4.0.0`
  - test: `@repo/vitest-config/node` 사용 (fetch mock 으로 충분 — jsdom 불필요)
- spec-04-02 문서 (spec/plan/task) + backlog auto-update 동봉
- 25 → 26 workspace projects

### T3 — TDD Red → Green (`53d8f0b` Red → `b6ef58e` Green)

**Red (`53d8f0b`)**:
- `index.test.ts` 9 test 박음 (vi.stubGlobal fetch mock):
  1. GET 200 + schema parse → 결과 반환
  2. GET 404 → AppError BAD_REQUEST (no retry)
  3. GET 500 → retry 후 UPSTREAM
  4. timeout → TIMEOUT
  5. network error → NETWORK
  6. schema validation fail → VALIDATION
  7. POST default → 1회만 시도
  8. POST with retries opt → retry 동작
  9. headers override + body JSON serialize
- stub `createSdk` (throw "not implemented") + `CreateSdkOptions/SdkRequestOptions/Sdk` 시그니처
- typecheck PASS + test 9/9 Red

**Green (`b6ef58e`)**:
- `createSdk` 본체 — `ky.create({ baseUrl, timeout, retry, hooks })`
- `toAppError(err)` helper — TimeoutError → TIMEOUT / HTTPError → BAD_REQUEST/UPSTREAM / else → NETWORK / zod fail → VALIDATION
- POST/PATCH `opts.retries` 박힌 경우 `retry.methods` 에 method 추가 (idempotency safety override)
- 초기 typecheck error — AppError 의 `statusCode: required` (TIMEOUT/NETWORK/VALIDATION 도 명시 박음, backend-http-client 답습)
- 초기 typecheck error — ky 2.x `prefixUrl` → `baseUrl` (web 표준)
- 초기 test fail — ky 2.x 가 fetch 에 *Request 객체* 박음 (string 아님). mock 검증 시 `request.url / .headers / .method` 사용. body 는 `request.clone().text()` (ky 가 이미 읽었음)
- test 9/9 ✓

### T4 — 통합 검증 (commit 없음)

- `pnpm lint` ✓ 18 tasks PASS
- `pnpm typecheck` ✓ 18 tasks FULL TURBO
- `pnpm test` ✓ 175 test PASS
- `pnpm exec depcruise` ✔ 0 violations (107 modules / 183 deps)
- `sdd test passed` 호출

### T5 — Ship (본 commit)

- walkthrough + pr_description 작성
- ship commit + push + PR 생성

## 🧪 검증 결과

### 자동화 테스트

| 패키지 | test 수 | 상태 |
|---|:---:|:---:|
| `@repo/frontend-sdk` (신규) | 9 | ✓ |
| 기타 16 패키지 (변경 없음) | 166 | ✓ |
| **합계** | **175** | **all green** |

### depcruise

```
✔ no dependency violations found (107 modules, 183 dependencies cruised)
```

이전 (PR #24 직후) 103 modules / 175 deps → +4 module / +8 dep (frontend-sdk + ky transitive).

### NeoAuth `auth-http` 대비 정정 검증

| NeoAuth 의 형편없는 점 | 정정 결과 |
|---|---|
| 1. 타입 안전성 약함 (cast only) | ✅ zod `safeParse()` + `AppError(VALIDATION)` |
| 2. 에러 비표준 (plain object throw) | ✅ `AppError` 변환 layer (`@repo/errors` 답습) |
| 3. boilerplate (Endpoint 매번 박음) | ✅ `sdk.get/post/...` 직접 호출 — endpoint shape 불필요 |
| 4. `.result` 호출자 강제 | ✅ SDK 안 박지 않음 — 도메인 영역 |
| 5. fixed retry: 1 | ✅ 옵션 노출 (`options.retries`, `opts.retries`) |
| 6. module-level side effect | ✅ factory pattern (`createSdk(options)`) — test 주입 가능 |
| 7. snake_case 변환 호출자 책임 (boilerplate) | ✅ SDK 안 박지 않음 — 도메인 영역 |

## 🔍 발견 사항

1. **ky 2.x breaking change — `prefixUrl` → `baseUrl`**: ky 2.0 부터 `baseUrl` 가 web 표준 (URL Resolution). `prefix` 는 *page-relative URL* 위해 별도 보존. 초기 시도 시 *prefixUrl* 박았다가 typecheck 에러 → `baseUrl` 정정.

2. **ky 2.x fetch 인자 변경 — Request 객체 박음**: 이전엔 fetch(`url, init`) 였으나 2.x 는 fetch(`Request` 객체) 박음. test mock 검증 시 `request.url / request.headers / request.method` 사용. body 는 *ky 가 이미 읽음* → `request.clone().text()` 박아야 함. 후속 spec 의 fetch mock 패턴 답습 가능.

3. **`AppError.statusCode: required`**: `@repo/errors` 의 AppError 가 statusCode 필수. backend-http-client 답습 — NETWORK: 0, TIMEOUT: 504, VALIDATION: 502. *AppError 시그니처 검토 필요* — `code` 가 자유로운데 *predefined statusCode mapping* 도 있음 (VALIDATION: 400 등). 우리는 *backend-http-client 정책* 답습 (VALIDATION: 502 — 응답 schema 가 잘못된 것은 *서버 잘못* 으로 분류).

4. **POST/PATCH retry idempotency safety**: ky default `retry.methods` 는 idempotent 만. POST/PATCH 가 *명시 opts.retries* 박힌 경우 *retry.methods 에 method 추가* — 동적 옵션 매핑. backend-http-client 의 `explicitRetries` 패턴 답습.

5. **vi.stubGlobal("fetch", ...) + vitest 4.x**: globalThis.fetch override 가 *Node 22+* 환경에서 자연 동작. Edge runtime / browser 모의 안 박혀있어 — 추후 *E2E* 검증 (spec-04-03/04 web-next/vite 진입 시점) 가치.

6. **frontend bundle 영향**: ky `^2.x` 가 ~3KB gzip — 작음. transitive dep: 없음 (zero-dep ky). frontend bundle 영향 *미미*.

7. **NeoAuth `.result` unwrap 패턴은 *우리 컨벤션 아님***: NeoAuth 의 backend (Spring?) 응답이 `{ result: T }` 형태였음. service-foundry 의 backend (NestJS) 는 *standard JSON* — `.result` unwrap 불필요. 후속 app spec 진입 시 *backend response shape* 결정 (raw / envelope) 별 spec.

8. **`@vitejs/plugin-react` 미사용** — sdk 패키지는 *React 없음* (pure SDK). node vitest preset 만 사용. 후속 react 패키지만 plugin-react 박음 (spec-04-01 frontend-ui 답습).

## 🚧 이월 항목

- **TanStack Query 통합**: 본 spec 은 *unopinionated*. spec-04-03 (web-next) / spec-04-04 (web-vite) 안에서 *각자의 query layer* 박음
- **reqId propagation 패턴 (SSR trace context)**: AsyncLocalStorage / next/headers 활용 — 별 spec (phase-05+ auth 또는 phase 별 observability)
- **contracts-defined endpoint metadata**: explicit 채택 — 추후 *DRY 가치 확인* 시 별 spec (`defineEndpoint({ path, method, request, response })`)
- **backend response envelope shape**: NeoAuth 의 `{ result: T }` 같은 패턴 vs raw JSON — apps/api 의 backend response 컨벤션 결정 별 spec
- **`shadcn add` 실 사용 시 components.json 호환 검증**: spec-04-01 이월 — spec-04-03/04 진입 시점에 확인
- **OpenAPI codegen**: phase-09 영역 (NestJS swagger + zod 통합 시점)

## 📅 메타

| 항목 | 값 |
|---|---|
| **작성자** | Agent + dennis |
| **작성 기간** | 2026-05-20 |
| **commits** | 3 (T2 scaffold + T3 Red/Green) + T5 ship (본 commit) |
| **test 수** | 9 신규 (`@repo/frontend-sdk`) — 전체 175 PASS |
| **depcruise** | 0 violations (107 modules / 183 deps, +4 / +8) |
| **신규 패키지** | `@repo/frontend-sdk` |
| **신규 catalog** | `ky ^2.0.2` |
| **NeoAuth 참고** | 형편없는 점 7 모두 정정 |
