# Walkthrough: spec-02-03

> Phase 2의 세 번째 spec. `@repo/validation` 신규 패키지 — zod 4.x 첫 사용자 + `parse` Result wrapper + `fromZodError` 변환 + 공통 schema 3종(Uuid / Email / Pagination). ADR-0010로 컨벤션 박음.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| zod v4 API 스타일 | (A) `z.uuid()` standalone / (B) `z.string().uuid()` chain | **A** | v4-native + 전용 타입 (`ZodUUID` / `ZodEmail`) 반환. chain은 legacy 호환용 |
| parse 시그니처 | `parse<T>(schema, data, msg?): Result<T, AppError>` | 채택 | safeParse → 우리 Result 어휘 일관 변환. 호출자 boilerplate 0 |
| fromZodError 시그니처 | `(error, msg?): AppError` | 채택 | issues → details.errors[{ path, message }] (ADR-0009 컨벤션 코드 구체화) |
| path join 규칙 | array index 포함 / 제외 | **포함** | `items.0.name` 형태. (string\|number)[] 전부 String() join — 사용자 분기에 충분 |
| 공통 schema 개수 | 3 (Uuid/Email/Pagination) / 더 많이 | **3** | YAGNI. Url/Slug/Iso8601Date 등은 도메인 spec에서 추가 |
| Pagination 기본값 | page=1 / perPage=20 / perPage max=100 | 채택 | REST 산업 표준. cursor 변형은 후속 |
| flat code 유지 | `ValidationError` subclass 만들기 / 안 만들기 | 안 만듦 | ADR-0009 일관. 구조는 `details.errors[]`로 표현 |
| parseAsync | 본 spec 포함 / 미제공 | 미제공 | YAGNI. async refine은 phase-03 backend에서 필요 시 |
| zod-validation-error 채택 | 채택 / 자체 구현 | **자체** | `fromZodError`가 동일 역할. 추가 의존성 회피 |
| @repo/utils 분류 | devDep (plan 초안) / **runtime dep** | runtime | parse가 ok/err를 런타임 사용 — plan 정정 |
| 기본 message 보존 | i18n 변환 / **zod 원문 보존** | 보존 | 디버깅 우선. i18n은 FE 책임 |
| ADR 시점 | 본 PR / 별 PR | 본 PR | 컨벤션 + 구현 한 추적 단위 |
| commit 단위 | red-green 분리 / **함수군당 1 commit (test+impl)** | 합침 | spec-02-02 패턴 답습 |

### ADR 승격 가이드

- [x] ADR 승격 대상 있음 → **ADR-0010** `docs/adr/0010-validation-zod-result-integration.md` (7 결정 + 6 Alternatives 비채택 분석)
- [ ] 없음

## 💬 사용자 협의

- **주제 1**: Plan Accept ("1") — 7-task 구성 + ADR-0010 본 PR 포함 + zod v4 정찰 T2에 묶기 그대로 진행.

> 본 spec은 scope 폭주가 없었고 plan과 실제 작업이 거의 일치. 유일한 *plan 정정*은 `@repo/utils` runtime/devDep 분류 (위 표).

## 🔬 zod v4 정찰 결과

T2에서 실제 import 후 v4 API 확인:

```
z.uuid()         → ZodUUID  (v4 standalone, 전용 타입)
z.string().uuid() → ZodString (chain, v4에서도 동작)
z.email()        → ZodEmail (v4 standalone)
z.string().email() → ZodString (chain)
```

**v3와 issue shape 차이**:

```jsonc
// v4
{
  "origin": "string",
  "code": "invalid_format",   // ← v3는 "invalid_string"
  "format": "uuid",            // ← v3는 "validation": "uuid"
  "pattern": "/^([0-9a-fA-F]{8}-.../",
  "path": [],
  "message": "Invalid UUID"
}
```

**결정**: standalone (`z.uuid()`, `z.email()`) — 전용 타입이 TS inference에 우위. chain은 호환용으로만.

**fromZodError 영향**: `issue.path.map(String).join(".")`로 v3/v4 모두 호환 (path 구조 자체는 동일).

## 🛡 lefthook race fix 검증 (RCA-001)

Phase 2의 핵심 위험 — RCA-001 fix(`parallel: false` + `piped: true` + typecheck `glob`) 후 첫 spec이라 정상 차단 동작 검증.

**reproducer**: `packages/shared/validation/src/__rca_repro.ts`에 `export const broken: number = "not a number";` 추가 후 commit 시도.

**결과**:
- biome ✅ (lint 통과)
- typecheck ❌ (`error TS2322: Type 'string' is not assignable to type 'number'`)
- → exit 2 → **lefthook이 정상 차단**
- main last commit `73ad1b3` 유지 (repro commit 안 만들어짐)
- reproducer 제거 후 정상 진행

**결론**: RCA-001 fix가 *spec-02-03 전체 작업 동안 race 재발 0건* + 명시적 reproducer로 invariant 검증.

## 🔍 발견 사항

### 1. `@repo/utils` 의존성 분류 plan 오류 (정정 완료)

plan.md에서 `@repo/utils`를 devDep로 분류했으나, `parse`가 `ok`/`err`를 *런타임*에 호출. T5에서 발견 후 runtime dep로 격상:

```diff
  "dependencies": {
    "@repo/errors": "workspace:*",
+   "@repo/utils": "workspace:*",
    "zod": "catalog:"
  },
  "devDependencies": {
-   "@repo/utils": "workspace:*",
    ...
  }
```

**교훈**: plan 단계에서 *런타임 import* vs *test-only import*를 더 명확히 구분. 다음 spec(02-04 contracts)에서도 동일 분류 필요.

### 2. `src/index.ts` 32 LOC (추정 60~100 대비 절반)

shared/* 패키지가 *함수 1줄 + 타입 export* 위주로 매우 간결. utils 67 LOC → errors 273 LOC → validation 32 LOC. 본 spec은 *zod에 위임*하는 wrapper 패턴이라 LOC가 적음. ADR-0010이 코드보다 길다는 *대형 결정의 작은 코드* 패턴.

### 3. zod v4 issue shape 변경이 호환에 영향 없음

`issue.path` 구조 자체는 v3/v4 동일 `(string | number)[]`. v4에서 `code` / `format` 필드명이 바뀌었으나 `fromZodError`는 *path + message만 추출*하므로 영향 없음. v3 fallback 코드 불필요 확인.

### 4. biome import 정렬 auto-fix가 commit 시 staged 갱신

T4, T5 commit 시 biome가 `import { ... } from "vitest"; import { z } from "zod"; ...` 순서를 자동 정렬. `stage_fixed: true` 동작 정상. RCA-001 fix(`parallel: false`)로 race 없이 안전.

### 5. depcruise 0 violations 유지 (17 modules / 17 deps)

`@repo/validation`이 신규 패키지로 합류했으나 boundary rule (shared/* → shared/* 허용, apps/* 역참조 금지) 모두 통과.

## 📚 산출물

- **신규 패키지**: `packages/shared/validation/` (32 LOC + 20 test).
- **ADR**: `docs/adr/0010-validation-zod-result-integration.md` — 7 결정 + 6 Alternatives.
- **commit 흐름**:
  - `57c1e13` feat(spec-02-03): scaffold @repo/validation with Uuid schema (zod v4)
  - `8833e23` feat(spec-02-03): add Email and Pagination schemas
  - `6c4bc35` feat(spec-02-03): add fromZodError ZodError -> AppError converter
  - `420d621` feat(spec-02-03): add parse Result wrapper for zod schemas
  - `73ad1b3` docs(spec-02-03): add ADR-0010 validation-zod-result-integration
  - (예정) ship commit
- **test 누적**: 92 (utils 16 + errors 56 + validation 20).
- **검증**: lint / typecheck / test / depcruise 모두 그린.

## 🔗 후속

- `spec-02-04` (contracts): 도메인 schema가 `parse(schema, data)` 사용 — 첫 consumer 검증 기회.
- `spec-02-05` (auth-contracts): 동일.
- Phase 3 backend: route handler validation에 `parse` 적용.
- Phase 4 frontend: form + axios interceptor에 `parse` + `isAppErrorResponse` 결합.
- Icebox: `@repo/typescript-config/env-agnostic` 변형 (DOM lib 패턴 2회째 → 격상 후보, 별 spec-x).
