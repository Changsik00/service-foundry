# Task List: spec-02-02

> 모든 task는 한 commit에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

## Pre-flight (Plan 작성 단계)

- [x] Spec ID 확정 및 디렉토리 생성 (`./specs/spec-02-02-shared-errors/`)
- [x] spec.md 작성 (v3 — round-trip + TS narrow 통합)
- [x] plan.md 작성 (v3)
- [x] task.md 작성 (이 파일 — 10 task)
- [x] phase-02.md SPEC 표 자동 갱신 (sdd spec new 시점)
- [x] 사용자 Plan Accept

---

## Task 1: 브랜치 생성

- [x] `git checkout -b spec-02-02-shared-errors`
- [x] Commit: 없음

---

## Task 2: 패키지 scaffold + AppError class + STANDARD_ERROR_REGISTRY

- [ ] `./packages/shared/errors/` 디렉토리 + scaffold (package.json / tsconfig.json / biome.json / vitest.config.ts) — `@repo/utils` 패턴 복제.
- [ ] `package.json`에 `@repo/utils` devDep 추가 (Result round-trip test용).
- [ ] `src/index.ts`:
  - `STANDARD_ERROR_REGISTRY` const record (8 entries)
  - `StandardErrorCode` type
  - `class AppError extends Error` (4 fields + 생성자 + `Error.captureStackTrace`)
- [ ] `src/index.test.ts`: AppError construction + 필드 + REGISTRY 매핑 확인 (≥ 3 test).
- [ ] `pnpm install`.
- [ ] `pnpm --filter @repo/errors test` → Pass.
- [ ] Commit: `feat(spec-02-02): scaffold @repo/errors with AppError class and STANDARD_ERROR_REGISTRY`

---

## Task 3: BE/FE round-trip — `toJSON` + `fromJSON` + `isAppErrorResponse`

### 3-1. TDD red
- [ ] `describe("toJSON")` (3 test: cause 제외 / 모든 필드 / 빈 details).
- [ ] `describe("fromJSON")` (4 test: 유효 shape → AppError / details 보존 / 무효 shape → fallback internal / null/undefined → fallback).
- [ ] `describe("isAppErrorResponse")` (3 test: 유효 shape / 누락 필드 / non-object).
- [ ] test → Fail.

### 3-2. TDD green
- [ ] `toJSON()` 메서드.
- [ ] `AppErrorResponse` type (`ReturnType<AppError["toJSON"]>`).
- [ ] `isAppErrorResponse(json): json is AppErrorResponse` (duck typing: code string / message string / statusCode number).
- [ ] `fromJSON(json: unknown): AppError` — 유효 shape면 new AppError, 무효면 fallback (이 시점에 wrap이 없으므로 `internalError` 직접 호출 또는 임시 inline 구현; T7 wrap 추가 후 refactor).
- [ ] test → Pass.
- [ ] Commit: `feat(spec-02-02): add toJSON/fromJSON round-trip and isAppErrorResponse guard`

---

## Task 4: 타입 가드 3종 — `isAppError` + `isCode<C>` + `isError`

### 4-1. TDD red
- [ ] `describe("isAppError")` (2 test).
- [ ] `describe("isCode")` (3 test: match / mismatch / non-AppError).
- [ ] `describe("isError")` (3 test: Error instance / cross-realm `[object Error]` mock / non-Error).
- [ ] test → Fail.

### 4-2. TDD green
- [ ] `isAppError(e): e is AppError`.
- [ ] `isCode<C extends string>(e, code: C): e is AppError & { code: C }`.
- [ ] `isError(e: unknown): e is Error` — `e instanceof Error || Object.prototype.toString.call(e) === "[object Error]"`.
- [ ] test → Pass.
- [ ] Commit: `feat(spec-02-02): add type guards (isAppError, isCode, isError)`

---

## Task 5: `errorMessage` + `errorCause` helpers

### 5-1. TDD red
- [ ] `describe("errorMessage")` (5 test: AppError / Error / string / object → JSON.stringify / null+undefined → fallback string).
- [ ] `describe("errorCause")` (3 test: AppError.cause / Error.cause (ES2022) / no cause).
- [ ] test → Fail.

### 5-2. TDD green
- [ ] `errorMessage(e: unknown): string` — AppError/Error는 `.message`, string은 그대로, 그 외는 `JSON.stringify` (실패 시 `String(e)`).
- [ ] `errorCause(e: unknown): unknown` — AppError.cause 우선 → Error.cause (in 가드).
- [ ] test → Pass.
- [ ] Commit: `feat(spec-02-02): add errorMessage and errorCause narrowing helpers`

---

## Task 6: 8 factory 함수

### 6-1. TDD red
- [ ] 8 describe 블록 (validationError ~ badGatewayError) × 2 test ≈ 16.
- [ ] test → Fail.

### 6-2. TDD green
- [ ] 8 factory 구현 — 모두 `STANDARD_ERROR_REGISTRY` lookup 패턴.
- [ ] test → Pass.
- [ ] Commit: `feat(spec-02-02): add 8 standard error factories`

---

## Task 7: `wrap(e, code?, message?)` helper + fromJSON refactor

### 7-1. TDD red
- [ ] `describe("wrap")` (4 test: AppError pass-through / Error preserve / string / object).
- [ ] test → Fail.

### 7-2. TDD green
- [ ] `wrap(e: unknown, code?: StandardErrorCode, message?: string): AppError` 구현 — `isAppError`/`isError`/`errorMessage` 활용.
- [ ] **`fromJSON` 리팩터**: 무효 shape fallback을 임시 직접 호출에서 `wrap(json, "INTERNAL", "Invalid error response shape")`로 정리.
- [ ] test → Pass (기존 fromJSON test 포함).
- [ ] Commit: `feat(spec-02-02): add wrap helper and refactor fromJSON fallback`

---

## Task 8: `Result<T, AppError>` round-trip 테스트

- [ ] `describe("Result with AppError")` (4 test):
  - `ok(user) | err(notFoundError(...))` + isOk/isErr narrow
  - `map(ok(user), toDto)` chain
  - `flatMap(err(...), nextFn)` short-circuit
  - `try { ... } catch (e) { return err(wrap(e)); }` 패턴
- [ ] test → Pass.
- [ ] Commit: `test(spec-02-02): verify Result<T, AppError> round-trip with @repo/utils`

---

## Task 9: ADR-0009 + depcruise 검증

- [ ] `./docs/adr/0009-app-error-design.md` 작성:
  - frontmatter `type: convention`, status: accepted
  - Context: ADR-0008 Result 후속 + 벤치마킹 결과 + BE/FE round-trip + TS unknown narrowing
  - Decision: 7 결정 (class extends Error / flat code / cause 제외 toJSON / 코드 네이밍 / 다중 에러 컨벤션 / RFC 7807 미채택 / 라이브러리 specific 가드는 Phase 4 SDK)
  - Consequences (긍정/부정)
  - Alternatives: `@hapi/boom` / `http-errors` / `neverthrow` / NestJS HttpException / RFC 7807 / Stripe-style / `@total-typescript/error` — 각 비채택 이유
  - Status: accepted (2026-05-18, spec-02-02 머지)
  - Related: ADR-0008, spec-02-02, 후속 phase-03/04
- [ ] `pnpm exec depcruise --config packages/config/depcruise-config/base.cjs packages/` → violation 0건.
- [ ] `wc -l ./packages/shared/errors/src/index.ts` (예상 180~280줄).
- [ ] Commit: `docs(spec-02-02): add ADR-0009 app-error-design convention`

---

## Task 10: Ship (필수)

- [ ] `pnpm lint` + `pnpm typecheck` + `pnpm test` **수동 재확인** (lefthook quirk 대비).
- [ ] `bash .harness-kit/bin/sdd test passed`.
- [ ] **walkthrough.md 작성** (결정 기록 + 벤치마킹 요약 + v1→v2→v3 진화 + lefthook quirk 재발 여부 + 발견 사항).
- [ ] **pr_description.md 작성**.
- [ ] `sdd ship --check` 통과.
- [ ] **Ship Commit**: sdd ship 자동.
- [ ] **Push**: `git push -u origin spec-02-02-shared-errors`.
- [ ] **PR 생성**: `gh pr create`.
- [ ] **사용자 알림**.

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 10 (T1 브랜치 + T2 scaffold+AppError+REGISTRY + T3 toJSON/fromJSON + T4 가드 3종 + T5 narrow helpers + T6 8 factory + T7 wrap+fromJSON refactor + T8 Result round-trip + T9 ADR + T10 ship) |
| **예상 commit 수** | 9 (T1 commit 없음) |
| **예상 test 수** | ~38 (AppError 3 + toJSON/fromJSON/isAppErrorResponse 10 + 가드 8 + errorMessage 5 + errorCause 3 + factory 16 + wrap 4 + Result 4) |
| **현재 단계** | Planning (v3 — BE/FE round-trip + TS narrow 통합) |
| **마지막 업데이트** | 2026-05-18 |
