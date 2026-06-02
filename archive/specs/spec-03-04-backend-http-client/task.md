# Task List: spec-03-04

> 모든 task는 한 commit에 대응합니다 (One Task = One Commit).
> **Phase Base Branch 모드** — PR base = `phase-03-backend-foundation`.

## Pre-flight

- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md / plan.md / task.md 작성
- [x] phase-03.md SPEC 표 자동 갱신
- [ ] 사용자 Plan Accept

---

## Task 1: 브랜치 생성

- [ ] `git checkout -b spec-03-04-backend-http-client` (시작 지점: `phase-03-backend-foundation`)
- [ ] Commit: 없음

---

## Task 2: `backend/http-client` scaffold + undici 정찰

- [ ] `packages/backend/http-client/` 디렉토리 + scaffold (spec-03-02 패턴):
  - `package.json` deps: `undici: catalog:` / `@repo/backend-logger: workspace:*` / `@repo/errors: workspace:*` / `zod: catalog:`
  - `package.json` devDeps: 표준 + `@types/node: catalog:`
  - `tsconfig.json` (types: ["node"], DOM 미포함, decorators 없음 — pure)
  - `vitest.config.ts` (`@repo/vitest-config/node`)
- [ ] undici API 정찰 — `MockAgent` / `Pool` / `fetch` 인터페이스 확인
- [ ] `src/index.ts` placeholder (`export {}`)
- [ ] `pnpm install` → lockfile 갱신
- [ ] `pnpm --filter @repo/backend-http-client typecheck` → 통과
- [ ] Commit: `feat(spec-03-04): scaffold @repo/backend-http-client (undici)`

---

## Task 3: `createHttpClient` factory + 기본 test (TDD)

- [ ] `src/index.test.ts` 작성 (undici `MockAgent` 사용):
  - `describe("createHttpClient")` 3 test:
    - baseUrl 적용 (path를 baseUrl + path로 합침)
    - default headers (Content-Type / Accept) 적용
    - 기본 GET 호출 성공 (200 JSON body parse)
- [ ] test → Fail
- [ ] `src/index.ts` 구현:
  - `CreateHttpClientOptions` / `HttpClient` / `HttpRequestOptions` 타입
  - `createHttpClient(options): HttpClient` (기본 GET 동작)
  - `request<T>(opts)` 기본 — fetch + JSON parse
  - `get` / `post` / `put` / `delete` / `patch` shortcut
- [ ] test → Pass (3)
- [ ] Commit: `feat(spec-03-04): add createHttpClient factory with typed methods`

---

## Task 4: retry policy + timeout (TDD)

- [ ] `src/index.test.ts`: `describe("retry policy")` 3 test:
  - 5xx retry → 마지막 시도에 200 응답 시 정상 return
  - network error retry → 동일 패턴
  - max retries 초과 시 `AppError({ code: "UPSTREAM" })` throw
- [ ] `describe("timeout")` 2 test:
  - 정상 응답 — timeout 안 걸림
  - timeout 시 `AppError({ code: "TIMEOUT" })` throw
- [ ] test → Fail (5)
- [ ] `src/index.ts` 구현:
  - retry loop (exponential backoff) — idempotent methods만 default
  - AbortController + setTimeout 으로 timeout
  - AppError throw (NETWORK / TIMEOUT / UPSTREAM 코드)
- [ ] test → Pass (8 누적)
- [ ] Commit: `feat(spec-03-04): add retry policy with exponential backoff + timeout`

---

## Task 5: X-Request-Id propagation + schema validation (TDD)

- [ ] `src/index.test.ts`: `describe("X-Request-Id propagation")` 2 test:
  - `runWithRequestId("abc-123", () => client.get("/x"))` → outbound header `X-Request-Id: abc-123` 검증 (MockAgent intercept)
  - 외부에서 호출 시 header 없음
- [ ] `describe("schema validation")` 1 test:
  - `client.get("/y", { schema: ZSchema })` → typed response
  - schema parse 실패 시 `AppError({ code: "VALIDATION" })`
- [ ] test → Fail (3)
- [ ] `src/index.ts` 구현:
  - `getCurrentRequestId()` 호출 → header 자동 attach
  - schema 인자 있으면 `schema.parse(body)`, 실패 시 AppError VALIDATION
- [ ] test → Pass (11 누적)
- [ ] Commit: `feat(spec-03-04): add X-Request-Id propagation + zod schema validation`

---

## Task 6: `nestjs/http-client` 어댑터 패키지 (TDD)

- [ ] `packages/nestjs/http-client/` 디렉토리 + scaffold:
  - `package.json` deps: `@nestjs/common: catalog:` / `@repo/backend-http-client: workspace:*` / `reflect-metadata: catalog:`
  - devDeps: 표준 + `@nestjs/core` / `@nestjs/testing` / `rxjs`
  - `tsconfig.json` (decorators + node types)
  - `vitest.config.ts`
- [ ] `src/index.test.ts`: `describe("HttpClientModule")` 1 test (DynamicModule 구조 + HTTP_CLIENT provider)
- [ ] test → Fail
- [ ] `src/index.ts` 구현:
  - `HTTP_CLIENT` symbol
  - `HttpClientModule.forRoot(options)` — `createHttpClient(options)` 호출 → DynamicModule
- [ ] `pnpm install` + test → Pass (12 누적)
- [ ] Commit: `feat(spec-03-04): add @repo/nestjs-http-client adapter package`

---

## Task 7: Ship (필수)

- [ ] `pnpm lint` + `pnpm typecheck` + `pnpm test` 그린
- [ ] `pnpm exec depcruise --config packages/config/depcruise-config/base.cjs packages/` → 0 violations
- [ ] `bash .harness-kit/bin/sdd test passed`
- [ ] **walkthrough.md 작성** (결정 + 발견 사항 + undici MockAgent 패턴 발견)
- [ ] **pr_description.md 작성**
- [ ] `sdd ship --check` 통과
- [ ] **Ship Commit**: sdd ship 자동
- [ ] **Push**: `git push -u origin spec-03-04-backend-http-client`
- [ ] **PR 생성**: `gh pr create --base phase-03-backend-foundation`
- [ ] **사용자 알림**

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 7 (T1 브랜치 / T2 scaffold / T3 createHttpClient / T4 retry+timeout / T5 reqId+schema / T6 nestjs 어댑터 / T7 ship) |
| **예상 commit 수** | 6 (T1 commit 없음) |
| **예상 test 수** | ~12 (createHttpClient 3 + retry 3 + timeout 2 + reqId 2 + schema 1 + Module 1) |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-05-19 |
