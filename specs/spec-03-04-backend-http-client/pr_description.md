# feat(spec-03-04): @repo/backend-http-client (pure) + @repo/nestjs-http-client (어댑터) — undici + retry/timeout/typed + reqId/schema

> Phase 3 (Backend Foundation) **4번째 spec**. ADR-0015 패턴 3회째 적용 (settings / logger / http-client). undici 기반 HTTP client + reqId propagation (AsyncLocalStorage from `@repo/backend-logger`) + optional zod schema validation.

## 📋 Summary

### 배경 및 목적

phase-03 진행:
- spec-03-01/02 (settings / logger) + spec-03-03 (ADR-0015 정정) 머지됨
- 다음: 외부 API / 다른 마이크로서비스 호출 표준화

`fetch` 직접 사용 = retry / timeout / circuit / typed *없음* — 외부 API 장애 시 application 다운. 각 service별 자체 wrapper 작성하면 *보일러플레이트 중복* + *reqId 전파 깨짐*. `@nestjs/axios`는 axios 의존 + reqId 연계 없음.

본 spec은 **2 패키지** (ADR-0015 패턴):
- `@repo/backend-http-client` (pure, framework-agnostic) — undici + retry/timeout/typed + reqId attach + schema validation
- `@repo/nestjs-http-client` (어댑터) — `HttpClientModule.forRoot()` + `HTTP_CLIENT` symbol

### 주요 변경 사항

- [x] **`packages/backend/http-client/` 신규** (`@repo/backend-http-client`, pure)
  - `createHttpClient({ baseUrl, timeoutMs?, retries?, retryBackoffMs?, headers? })` factory
  - typed methods: `request / get / post / put / delete / patch` (Generic `<T>` + optional zod schema)
  - retry policy: exponential backoff, idempotent methods 만 default (GET/PUT/DELETE/HEAD)
  - timeout: AbortController 기반, default 10s
  - X-Request-Id 자동 attach (workspace dep `@repo/backend-logger` AsyncLocalStorage)
  - optional zod schema validation → 실패 시 AppError VALIDATION (502)
  - error codes: NETWORK / TIMEOUT / UPSTREAM / BAD_REQUEST / VALIDATION

- [x] **`packages/nestjs/http-client/` 신규** (`@repo/nestjs-http-client`, 어댑터)
  - `HTTP_CLIENT` symbol injection token
  - `HttpClientModule.forRoot(options)` DynamicModule (객체 리터럴, global)
  - deps: `@nestjs/common` + `@repo/backend-http-client` (workspace) + `reflect-metadata`

- [x] **catalog 추가**: `undici` ^8.3.0 (T2 정찰 최신)

### Phase 컨텍스트

- **Phase**: `phase-03` Backend Foundation (Phase Base Branch 모드)
- **PR Target**: `phase-03-backend-foundation`
- **선행 spec**: spec-03-02 backend-logger (AsyncLocalStorage reqId), spec-03-03 ADR-0015 정정 (pure/어댑터 패턴)
- **본 SPEC 역할**: 외부 API 호출 *표준 어휘* 박음. 후속 spec (database / observability / apps-api) 이 본 패키지 사용.

## 🎯 Key Review Points

1. **🎯 ADR-0015 패턴 3회째 안정 적용**: pure + 어댑터 2 패키지 분리, `nestjs/<X>` 카테고리 + `@repo/nestjs-<X>` 명명 — 일관 답습. 객체 리터럴 DynamicModule + symbol injection token도 동일. 4회 반복 후 *ADR 격상 후보* (Icebox).

2. **undici locked + Fetch API**: ADR-0002 catalog locked. `fetch()` 전역 API + MockAgent global dispatcher 패턴으로 test 외부 dep 0. axios 의존 회피.

3. **retry idempotent 정책 (POST 보호)**: RFC 9110 idempotent set (GET/PUT/DELETE/HEAD) 만 default retry. POST/PATCH는 *명시적 `retries` 옵션* 시만 — 결제 중복 같은 사고 방지.

4. **AsyncLocalStorage reqId 자동 propagation**: workspace dep `@repo/backend-logger` 의 `getCurrentRequestId()` 호출 → outbound `x-request-id` header 자동 attach. 함수 인자 통과 0. *distributed trace 끊김 방지*.

5. **optional zod schema validation**: `client.get<T>("/path", { schema: ZSchema })` → typed response + 실패 시 AppError VALIDATION. upstream contract 위반을 *런타임 catch*. 사용 안 하면 비용 0.

6. **error codes 분리**: NETWORK (statusCode 0) / TIMEOUT (504) / UPSTREAM (원본 5xx) / BAD_REQUEST (원본 4xx) / VALIDATION (502) — ADR-0009 AppError 자유 code 정책 활용. retry 정책이 코드별 다름 (5xx retry, 4xx immediate fail).

7. **AbortController + timeout**: undici의 timeout 옵션 대신 Node 표준 AbortController. per-request override 쉬움 + AbortError 감지로 *명확한 TIMEOUT 매핑*.

8. **HttpRequestOptions<TOutput> generic**: schema 인자 있을 때 return 타입 자동 추론 (`z.infer<typeof schema>`). 사용자 코드에서 *수동 generic 박을 필요 0* — zod + TS generic 조합.

9. **MockAgent test 패턴**: undici 내장 `MockAgent` + `setGlobalDispatcher` 로 외부 dep 0 단위 test. `replyWithError` / `.delay()` / `.times()` 로 retry / timeout / network 시뮬레이션. *test가 우연히 실제 호출하지 않음* 정적 보장 (`disableNetConnect()`).

10. **`exactOptionalPropertyTypes: true` 호환**: body 인자 조건부 spread (`...(body !== undefined && { body })`) — backend 패키지에서 자주 반복되는 패턴. 향후 utility helper 검토 가치 (walkthrough §발견 사항 #3).

## 🧪 Verification

### 자동 테스트

```bash
pnpm install && pnpm lint && pnpm typecheck && pnpm test
pnpm exec depcruise --config packages/config/depcruise-config/base.cjs packages/
```

**결과**:
- ✅ `pnpm install`: undici 추가 후 정상 (engines warning 외 0)
- ✅ `pnpm lint`: 11 tasks PASS
- ✅ `pnpm typecheck`: 11 tasks FULL TURBO
- ✅ `pnpm test`: **12 test PASS** (backend 11 + nestjs 1)
- ✅ `depcruise`: **0 violations** (51 modules / 74 dependencies)

### test 분포 (12)

**`@repo/backend-http-client` (11 test)**:

| describe | test count | 검증 |
|---|:---:|---|
| `createHttpClient` | 3 | baseUrl 적용 / default headers outbound / 기본 GET 성공 |
| `retry policy` | 3 | 5xx retry 성공 / network error retry / max retries 초과 → UPSTREAM |
| `timeout` | 2 | 정상 응답 / timeout 시 TIMEOUT (504) |
| `X-Request-Id propagation` | 2 | runWithRequestId 안 → outbound header / 밖 → header 없음 |
| `schema validation` | 1 | zod 통과 + 실패 → VALIDATION (502) |

**`@repo/nestjs-http-client` (1 test)**:

| describe | test count | 검증 |
|---|:---:|---|
| `HttpClientModule` | 1 | DynamicModule 구조 + HTTP_CLIENT provider + HttpClient 인스턴스 |

### 수동 검증

```ts
// reqId propagation 실 사용
import { runWithRequestId } from "@repo/backend-logger";
import { createHttpClient } from "@repo/backend-http-client";

const client = createHttpClient({ baseUrl: "https://example.com" });
await runWithRequestId("abc-123", async () => {
  await client.get("/api/test"); // outbound: x-request-id: abc-123
});

// schema validation 실 사용
import { z } from "zod";
const UserSchema = z.object({ id: z.number(), name: z.string() });
const user = await client.get("/users/1", { schema: UserSchema });
// user: { id: number; name: string } — typed + 런타임 검증
```

## 🔗 참조

- **선행 ADR**: [`docs/adr/0015-framework-adapter-naming-and-layout.md`](../docs/adr/0015-framework-adapter-naming-and-layout.md) (PR #11)
- **선행 spec**: spec-03-02 backend-logger (AsyncLocalStorage), spec-03-03 ADR-0015 정정
- **walkthrough**: `specs/spec-03-04-backend-http-client/walkthrough.md`
- **memory**: `feedback_platform_agnostic_packages` + `project_boilerplate_package_layout`
- **후속 spec**: spec-03-05 backend-database (Drizzle) — 같은 pure/어댑터 패턴 답습 (4회째 → ADR 격상)

## 📝 Post-Merge

- [ ] Merge → `phase-03-backend-foundation` (Phase Base Branch 모드)
- [ ] Auto-sync: `backlog/phase-03.md` / `backlog/queue.md` (spec-03-04 → Merged)
- [ ] 사용자 알림 + 후속 spec (03-05 backend-database) 진입 옵션 제시

## ✅ Definition of Done

- [x] `packages/backend/http-client/` 신규 (pure)
- [x] `packages/nestjs/http-client/` 신규 (어댑터)
- [x] `createHttpClient` + retry + timeout + reqId propagation + optional schema validation
- [x] `HttpClientModule.forRoot()` DynamicModule
- [x] `pnpm test` 그린 (12 test)
- [x] `pnpm lint` / `pnpm typecheck` 그린
- [x] `pnpm exec depcruise` 0 violations (51 modules / 74 deps)
- [ ] `walkthrough.md` / `pr_description.md` ship commit (본 commit 직후)
- [ ] PR 생성 (base = `phase-03-backend-foundation`)
- [ ] 사용자 알림
