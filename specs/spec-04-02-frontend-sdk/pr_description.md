# feat(spec-04-02): `@repo/frontend-sdk` — ky 기반 typed API client + AppError 변환

> Phase 4 (Frontend Foundation) 두 번째 spec. `@repo/frontend-sdk` 신설 — **ky** 기반 cross-env typed API client + `AppError` 변환 layer + explicit zod schema binding. NeoAuth `auth-http` 코드 리뷰 후 *형편없는 점 7개 모두 정정*.

## 📋 Summary

### 배경 및 목적

phase-04 의 spec-04-01 (`@repo/frontend-ui`) 머지 후, *typed API client* 필요. `@repo/contracts` (Phase 2) 의 `UserProfile` / `paginatedResponse<T>` zod schema 를 *fetch 결과 검증* 도구로 박음. backend-http-client (Node-only undici) 는 frontend bundle 수용 불가 — cross-env (Next Server/Client, Vite SPA, Edge) 지원 필요.

### 주요 변경 사항

- [x] **`@repo/frontend-sdk` 신설** (`packages/frontend/sdk/`):
  - `createSdk(options)` factory — `ky.create({ baseUrl, timeout, retry, hooks })`
  - `Sdk` interface — backend-http-client 와 동일 API surface (`request/get/post/put/delete/patch`)
  - `toAppError(err)` 변환 layer:
    - `TimeoutError` → `AppError(TIMEOUT, statusCode: 504)`
    - `HTTPError` 4xx → `AppError(BAD_REQUEST, statusCode: response.status)`
    - `HTTPError` 5xx → `AppError(UPSTREAM, statusCode: response.status)`
    - 그 외 → `AppError(NETWORK, statusCode: 0)`
    - zod parse fail → `AppError(VALIDATION, statusCode: 502)`
  - retry 정책 (ky 옵션 매핑):
    - default `IDEMPOTENT_METHODS` (`get/put/delete/head/options/trace`)
    - POST/PATCH 도 `opts.retries` 명시 시 retry (idempotency override)
    - `retry.statusCodes: [408, 413, 429, 500, 502, 503, 504]`
  - explicit zod schema (`schema?: ZodType<T>`)

- [x] **catalog 갱신** (`pnpm-workspace.yaml`):
  - `ky: ^2.0.2` (~3KB gzip, zero-dep, fetch 기반, sindresorhus maintained)

- [x] **단위 테스트 9 신규** (vi.stubGlobal fetch mock)

### Phase 컨텍스트

- **Phase**: `phase-04` Frontend Foundation (Phase Base Branch 모드)
- **PR Target**: `phase-04-frontend-foundation`
- **본 SPEC 역할**: phase-04 의 *typed API client 기반* — spec-04-03/04 (web-next/vite) 가 본 SDK import 검증

## 🎯 Key Review Points

1. **🎯 ky 채택 — NeoAuth 답습 + 형편없는 점 7개 정정**: 사용자가 NeoAuth `auth-http` 코드 제시 → Agent 평가 후 *ky 채택 유지 + 모든 결함 정정*:
   - 타입 안전성 (cast → zod parse + VALIDATION AppError)
   - 에러 비표준 (plain object → AppError class)
   - factory pattern (module-level side effect 제거)
   - retry/timeout 옵션 노출 (fixed → configurable)
   - boilerplate 제거 (sdk.get/post 직접 — Endpoint shape 불필요)
   - snake_case / .result unwrap → SDK 밖 (호출자 도메인)

2. **backend-http-client 와 *동일 API surface***: `request<T>(opts)` / `get/post/put/delete/patch`. monorepo 일관 + 학습 비용 ↓. 단 *내부 구현* 은 ky (backend = undici 직접) — *비대칭 자연* (cross-env 한계).

3. **AppError 5 codes — backend-http-client 답습**: ADR-0009 (AppError) 답습. NETWORK / TIMEOUT / UPSTREAM / BAD_REQUEST / VALIDATION. statusCode 매핑 — NETWORK: 0 / TIMEOUT: 504 / VALIDATION: 502 (응답 schema 잘못은 서버 잘못).

4. **POST/PATCH idempotency safety**: default `retry.methods` idempotent only. POST/PATCH 도 `opts.retries` 명시 시 *해당 method 만 추가* — 호출자 명시적 책임. backend-http-client 의 `explicitRetries` 패턴 답습.

5. **explicit zod schema binding**: 호출자가 `sdk.get<UserProfile>("/me", { schema: UserProfile })` — `@repo/contracts` 의 schema 명시 import. contracts-defined endpoint metadata (DRY ↑) 는 *추후 검증 후 별 spec*.

6. **ky 2.x breaking change 발견 + 정정**: (a) `prefixUrl` → `baseUrl` (web 표준), (b) fetch 인자가 `Request` 객체 (string 아님) — test mock 검증 패턴 정정.

7. **frontend bundle ~3KB gzip 추가**: ky zero-dep, 작음. transitive dep 없음. cross-env (browser + Node 18+ + Edge) 모두 호환.

8. **NeoAuth 대비 검증** (walkthrough 의 표 참고): 7개 형편없는 점 모두 정정 검증.

9. **`pnpm exec depcruise` 0 violations** (107 modules / 183 deps): ADR-0015 룰 통과. `packages/frontend/*` → `packages/backend/*` import 0건.

10. **commit 3개 (excl ship)**: catalog+scaffold → Red → Green. TDD 명확 분리.

## 🧪 Verification

### 자동 테스트

```bash
pnpm install && pnpm lint && pnpm typecheck && pnpm test
pnpm exec depcruise --config packages/config/depcruise-config/base.cjs .
```

**결과**:
- ✅ `pnpm lint`: 18 tasks PASS
- ✅ `pnpm typecheck`: 18 tasks FULL TURBO
- ✅ `pnpm test`: **175 test PASS** (frontend-sdk 9 신규 + 기존 166)
- ✅ `depcruise`: **0 violations** (107 modules / 183 dependencies)

### test 분포 (9 신규 — `@repo/frontend-sdk`)

| describe | test 수 | 검증 |
|---|:---:|---|
| `createSdk` | 9 | GET 200+schema / 404 BAD_REQUEST / 500 retry UPSTREAM / timeout TIMEOUT / network NETWORK / validation VALIDATION / POST no-retry / POST retry / headers+body |

### 수동 검증

```bash
# 1. 신규 패키지
ls packages/frontend/sdk/src/
# → index.ts + index.test.ts

# 2. ky catalog
grep "ky:" pnpm-workspace.yaml
# → ky: ^2.0.2

# 3. exports
grep "^export" packages/frontend/sdk/src/index.ts
# → HttpMethod / CreateSdkOptions / SdkRequestOptions / Sdk / createSdk
```

## 🔗 참조

- **ADR**: [`docs/adr/0009-app-error.md`](../docs/adr/0009-app-error.md), [`docs/adr/0015-framework-adapter-naming-and-layout.md`](../docs/adr/0015-framework-adapter-naming-and-layout.md)
- **walkthrough**: `specs/spec-04-02-frontend-sdk/walkthrough.md` (결정 13 + 협의 7 + 진행 5 + 검증 + 발견 8 + 이월 6)
- **참고 코드 (사용자 제시)**: `/Users/dennis/Project/NeoAuth/packages/auth-http` — 형편없는 점 7개 정정 (walkthrough §검증 표 참고)
- **선행 spec**: spec-04-01 frontend-ui — `@repo/tailwind-config` + `@repo/frontend-ui` 머지됨
- **후속 spec**: spec-04-03 web-next-scaffold → spec-04-04 web-vite-scaffold

## 📝 Post-Merge

- [ ] Merge → `phase-04-frontend-foundation` (Phase Base Branch 모드)
- [ ] Auto-sync: `backlog/phase-04.md` / `backlog/queue.md` (spec-04-02 → Merged)
- [ ] 사용자 알림 + spec-04-03 (web-next-scaffold) 진입 옵션

## ✅ Definition of Done

- [x] `@repo/frontend-sdk` 신설 (`createSdk` factory + `Sdk` interface)
- [x] ky 채택 + retry/timeout/hooks 옵션 매핑 (backend-http-client 정책 답습)
- [x] `hooks.beforeError` → `AppError` 변환 layer
- [x] AppError codes: NETWORK / TIMEOUT / UPSTREAM / BAD_REQUEST / VALIDATION
- [x] explicit schema binding (`schema?: ZodType<T>`) — parse fail VALIDATION
- [x] 단위 테스트 9 PASS
- [x] `pnpm lint` / `pnpm typecheck` 그린
- [x] `pnpm exec depcruise` 0 violations
- [ ] `walkthrough.md` / `pr_description.md` ship commit (본 commit 직후)
- [ ] PR 생성 (base = `phase-04-frontend-foundation`)
- [ ] 사용자 알림
