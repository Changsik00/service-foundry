# Task List: spec-02-03

> 모든 task는 한 commit에 대응합니다 (One Task = One Commit).

## Pre-flight

- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md / plan.md / task.md 작성
- [x] phase-02.md SPEC 표 자동 갱신
- [ ] 사용자 Plan Accept

---

## Task 1: 브랜치 생성

- [x] `git checkout -b spec-02-03-shared-validation`
- [x] Commit: 없음

---

## Task 2: 패키지 scaffold + zod v4 정찰 + `Uuid` schema + 첫 test

- [x] `packages/shared/validation/` 디렉토리 + scaffold (package.json / tsconfig.json (DOM lib 포함) / vitest.config.ts).
- [x] `package.json` deps: `zod: catalog:` + `@repo/errors: workspace:*` (런타임).
- [x] devDeps: `@repo/utils: workspace:*` + biome/typescript/vitest config.
- [x] `pnpm install` → lockfile에 zod 추가.
- [x] `src/index.ts`: zod v4 API 정찰 — `z.uuid()` 채택 (`ZodUUID` 전용 타입, v4-native standalone).
- [x] `src/index.test.ts`: `describe("Uuid")` 3 test (valid v4 UUID / invalid string / 빈 string).
- [x] `pnpm --filter @repo/validation test` → Pass (3/3).
- [x] 실제 zod v4 API 동작을 walkthrough에 기록 (v3과 차이점).
- [x] Commit: `feat(spec-02-03): scaffold @repo/validation with Uuid schema (zod v4)`

---

## Task 3: `Email` + `Pagination` 공통 schema

- [x] `describe("Email")` 3 test (valid / invalid / 빈 string).
- [x] `describe("Pagination")` 4 test (defaults / 명시값 / page 0 reject / perPage 101 reject).
- [x] test → Fail (7 fail).
- [x] `Email` + `Pagination` + `PaginationInput` / `PaginationOutput` type 구현.
- [x] test → Pass (10/10).
- [x] Commit: `feat(spec-02-03): add Email and Pagination schemas`

---

## Task 4: `fromZodError` 변환

- [x] `describe("fromZodError")` 4 test:
  - 단일 issue → details.errors[0].path / message
  - 중첩 path (`user.email`) join
  - array index path (`items.0.name`)
  - custom message override + zod 기본 message 보존
- [x] test → Fail (4 fail).
- [x] `fromZodError(error: ZodError, message?: string): AppError` 구현.
- [x] test → Pass (14/14).
- [x] Commit: `feat(spec-02-03): add fromZodError ZodError -> AppError converter`

---

## Task 5: `parse<T>` Result wrapper

- [ ] `describe("parse")` 6 test:
  - 성공 → `ok(data)`
  - 실패 → `err(AppError)` + code=VALIDATION
  - 중첩 schema 실패 → details.errors path 올바름
  - array path 실패 → 동일
  - custom message override
  - zod transform/refine 성공/실패 케이스
- [ ] test → Fail.
- [ ] `parse<T>(schema, data, message?): Result<T, AppError>` 구현.
- [ ] test → Pass.
- [ ] Commit: `feat(spec-02-03): add parse Result wrapper for zod schemas`

---

## Task 6: ADR-0010 + depcruise 검증

- [ ] `docs/adr/0010-validation-zod-result-integration.md` 작성:
  - frontmatter `type: convention`, status: accepted
  - Context: ADR-0008/0009 후속, safeParse↔Result 변환 boilerplate 해소, ADR-0009 details.errors[] 컨벤션 코드 구체화
  - Decision: 7개 (parse wrapper / fromZodError 컨벤션 / 공통 schema 3 / flat code 유지 / Pagination 기본값 / parseAsync 미제공 / zod-validation-error 미채택 — 우리 fromZodError가 동일 역할)
  - Consequences (긍정/부정)
  - Alternatives: zod-validation-error / valibot / yup / superstruct / io-ts — 비채택 이유
  - Status: accepted (2026-05-18, spec-02-03 머지)
  - Related: ADR-0008 / 0009, 후속 spec-02-04/05 / Phase 3 backend / Phase 4 frontend
- [ ] `pnpm exec depcruise --config packages/config/depcruise-config/base.cjs packages/` → violation 0건.
- [ ] `wc -l packages/shared/validation/src/index.ts` (예상 60~100줄).
- [ ] Commit: `docs(spec-02-03): add ADR-0010 validation-zod-result-integration`

---

## Task 7: Ship (필수)

- [ ] `pnpm lint` + `pnpm typecheck` + `pnpm test` 그린 (lefthook race fix 검증 — 정상 차단 동작).
- [ ] `bash .harness-kit/bin/sdd test passed`.
- [ ] **walkthrough.md 작성** (결정 + zod v4 API 정찰 결과 + lefthook race 재발 여부 + 발견 사항).
- [ ] **pr_description.md 작성**.
- [ ] `sdd ship --check` 통과.
- [ ] **Ship Commit**: sdd ship 자동.
- [ ] **Push**: `git push -u origin spec-02-03-shared-validation`.
- [ ] **PR 생성**: `gh pr create`.
- [ ] **사용자 알림**.

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 7 (T1 브랜치 + T2 scaffold+Uuid + T3 Email/Pagination + T4 fromZodError + T5 parse + T6 ADR + T7 ship) |
| **예상 commit 수** | 6 (T1 commit 없음) |
| **예상 test 수** | ~20 (Uuid 3 + Email 3 + Pagination 4 + fromZodError 4 + parse 6) |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-05-18 |
