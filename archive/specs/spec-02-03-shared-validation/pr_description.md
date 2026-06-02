# feat(spec-02-03): @repo/validation — zod 4.x + parse Result wrapper + 공통 schema 3 + ADR-0010

## 📋 Summary

### 배경 및 목적

Phase 2 "shared primitives"의 세 번째 spec. ADR-0008 `Result<T, E>` + ADR-0009 `AppError` 후속으로 *validation 계층의 공통 어휘*를 박는다. catalog `zod ^4.4.3`의 *첫 사용자*. ADR-0009의 `details.errors[]` 컨벤션이 *문서로만 있던 것*을 코드로 구체화. 모든 후속 spec/phase가 `parse(schema, data)` 한 줄로 validation 진입.

### 주요 변경 사항

- [x] **`@repo/validation` 신규 패키지** (scaffold + 32 LOC + 20 test)
- [x] **`parse<T>(schema, data, message?): Result<T, AppError>`** — safeParse → 우리 Result 어휘 일관 변환
- [x] **`fromZodError(error, message?): AppError`** — issues → `details.errors[{ path, message }]` (ADR-0009 컨벤션 코드 구체화)
- [x] **공통 schema 3종**: `Uuid` (z.uuid v4-native) / `Email` (z.email v4-native) / `Pagination` (page/perPage with defaults 1/20, max 100)
- [x] **타입 export**: `PaginationInput` (z.input — 사용자 입력) / `PaginationOutput` (z.output — 기본값 적용 후)
- [x] **zod v4 API 정찰** — standalone (`z.uuid()`, `z.email()`) 채택. ZodUUID/ZodEmail 전용 타입 + v3와 issue shape 차이 walkthrough에 기록
- [x] **shared/* DOM lib 패턴 2회째 적용** — `validation/tsconfig.json`에 `lib: ["ES2023", "DOM"]`
- [x] **ADR-0010** (`docs/adr/0010-validation-zod-result-integration.md`) — 7 결정 + 6 Alternatives (`zod-validation-error` / `valibot` / `yup` / `superstruct` / `io-ts` / wrapper 없이 zod만) 비채택 분석

### Phase 컨텍스트

- **Phase**: `phase-02` — Shared Primitives (In Progress, 5 spec 중 3번째)
- **본 SPEC의 역할**: 모든 후속 spec (`shared-contracts` / `shared-auth-contracts`) + Phase 3 backend / Phase 4 frontend가 공통 의존하는 *validation 진입점*. ADR-0010로 컨벤션 박음. 본 PR 머지 후 spec-02-04 (contracts) 진입 가능.

## 🎯 Key Review Points

1. **zod 4.x 첫 사용자 검증 완료**: T2에서 실제 import 후 정찰. `z.uuid()` standalone이 *v4-native* (전용 타입 `ZodUUID` 반환). chain `z.string().uuid()`도 동작하나 `ZodString` 반환이라 TS inference 우위 차이. **standalone 채택** — walkthrough §zod v4 정찰 결과.
2. **양방향 wire와 통합**: spec-02-02의 `toJSON ↔ fromJSON`과 결합하면 *FE axios interceptor*에서 `parse(schema, fromJSON(resp.data))` 한 줄로 *valid AppError + Result* 복원. Phase 4에서 활용.
3. **`details.errors[]` 컨벤션 코드 구체화**: ADR-0009에서 문서로만 박았던 형식이 `fromZodError`로 구현. nested path는 `.` join (`user.email`), array index 포함 (`items.0.name`). 모든 후속 validation의 *표준 wire format*.
4. **공통 schema 3개 제한 (YAGNI)**: `Url` / `PhoneNumber` / `Iso8601Date` / `Slug` 등은 *도메인 spec에서 필요 시*. scope 폭주 방지. 도메인 schema에서 `z.url()` / `z.iso.datetime()` 등 zod 표준 *직접 사용 가능* (재export 불필요).
5. **flat code 유지 (ADR-0009 일관)**: `ValidationError` subclass 안 만듦. 모든 zod 실패는 `code: "VALIDATION"` 단일 + `details.errors[]`로 *구조적* 표현. *어떤 필드가 실패했는지*는 details에서 파싱.
6. **`parseAsync` 미제공**: YAGNI. async refine은 phase-03 backend에서 필요 시 별 spec. 본 spec은 sync `parse`만.
7. **`@repo/utils` 분류 plan 정정** ⚠️: plan에서 devDep로 분류했으나 `parse`가 `ok`/`err`를 *런타임 사용*. T5에서 발견 후 runtime dep로 격상. walkthrough §발견 사항 #1에 기록.
8. **lefthook race fix 검증 완료** ✅: RCA-001 fix(`parallel: false` + `piped: true` + typecheck `glob`) 후 첫 spec. T7에서 reproducer로 typecheck FAIL 시도 → **정상 차단** 확인. 본 spec 전체 작업 동안 race 재발 0건.
9. **fromZodError가 zod 기본 message 보존**: i18n 변환 안 함. `details.errors[].message`에는 zod 원문 그대로 (`"Invalid UUID"`, `"Expected string, received number"` 등). `message?` 인자는 *AppError.message* (도메인 메시지) override만. 이유: 디버깅 가능성 우선, i18n은 FE 책임 — ADR-0010 결정 7.
10. **src/index.ts 32 LOC**: plan 추정(60~100)보다 절반. shared/* 패턴(*함수 1줄 + 타입 export* 위주) + zod 위임으로 매우 간결. *ADR이 코드보다 길다*는 대형 결정 / 작은 코드 패턴 — walkthrough §발견 사항 #2.

## 🧪 Verification

### 자동 테스트

```bash
pnpm install && pnpm lint && pnpm typecheck && pnpm test
pnpm exec depcruise --config packages/config/depcruise-config/base.cjs packages/
```

**결과 요약**:
- ✅ `pnpm install`: engines warning 외 0 warning
- ✅ `pnpm lint`: Biome PASS (5 files / 0 issues)
- ✅ `pnpm typecheck`: tsc --noEmit PASS (FULL TURBO cache hit)
- ✅ `pnpm test`: **92 test PASS** (utils 16 + errors 56 + validation 20)
  - validation 패키지 단독: 20/20 (Uuid 3 + Email 3 + Pagination 4 + fromZodError 4 + parse 6)
- ✅ `depcruise`: 0 violations (17 modules / 17 deps)

### 수동 검증

1. **parse 성공/실패 round-trip** ✅:
   ```ts
   const ok = parse(Email, "user@example.com");  // { ok: true, value: "user@example.com" }
   const ng = parse(Email, "bad");                // { ok: false, error: AppError { code: "VALIDATION", statusCode: 400, details: { errors: [...] } } }
   ```
2. **중첩 + array index path 변환** ✅:
   ```ts
   parse(z.object({ user: z.object({ email: Email }) }), { user: { email: "bad" } });
   // → details.errors[0].path === "user.email"
   parse(z.object({ items: z.array(z.object({ id: Uuid })) }), { items: [{ id: "bad" }] });
   // → details.errors[0].path === "items.0.id"
   ```
3. **transform/refine 통합** ✅: trim + length 검증 모두 동작 — test에서 검증.
4. **lefthook race fix invariant** ✅: T7 reproducer로 typecheck FAIL → commit 정상 차단 (main last commit 유지).

## 📐 Architecture / Decision

- [x] **ADR 작성** → ADR-0010 (`docs/adr/0010-validation-zod-result-integration.md`)
  - 7 결정 + zod v4 standalone API 채택 + message 보존 결정
  - 6 alternatives 비채택 분석 (자세한 trade-off 표는 ADR 본문)
- [x] **walkthrough.md** — 결정 기록 (13건) + zod v4 정찰 + lefthook race 검증 + 발견 사항 5건
- [x] **pr_description.md** — 본 문서

## 🚫 Out of Scope (의도적 deferral)

- 추가 공통 schema (Url / PhoneNumber / Iso8601Date / Slug 등) — 도메인 spec에서 필요 시.
- Pagination cursor 기반 변형 — offset만. cursor는 후속 spec 또는 phase.
- `zod-validation-error` 라이브러리 통합 — 우리 `fromZodError`가 동일 역할.
- i18n 메시지 변환 — `fromZodError`는 zod 원문 보존. FE 책임.
- `parseAsync<T>` Promise wrapper — phase-03 필요 시.
- react-hook-form / formik 통합 — Phase 4 frontend.
- OpenAPI 변환 — Phase 4 `@repo/frontend/sdk`.
- `@repo/typescript-config/env-agnostic` 변형 추가 — DOM lib 패턴 2회째 격상 후보지만 별 spec-x. Icebox.

## 🔗 Related

- **선행**:
  - ADR-0002 (zod ^4.4.3 catalog 결정)
  - ADR-0008 (`Result<T, E>`) — `parse` 반환 타입
  - ADR-0009 (`AppError + details.errors[]`) — 본 spec이 *코드 구체화*
  - RCA-001 (lefthook race fix) — 본 spec이 검증 첫 spec
- **후속**:
  - spec-02-04 (contracts): 첫 consumer
  - spec-02-05 (auth-contracts)
  - Phase 3 backend: route handler validation
  - Phase 4 frontend: form + axios interceptor
- **코드**: [`packages/shared/validation/src/index.ts`](../../packages/shared/validation/src/index.ts), [`docs/adr/0010-validation-zod-result-integration.md`](../../docs/adr/0010-validation-zod-result-integration.md)
