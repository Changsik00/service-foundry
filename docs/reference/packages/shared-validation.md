---
type: reference
aliases: ["@repo/validation", "유효성 검증"]
tags: [service-foundry, reference, shared, validation]
---

# @repo/validation — Zod 기반 공유 유효성 검증 레이어

> 💡 **한 줄 요약**: `parse()` 함수로 Zod 스키마 검증 결과를 `Result<T, AppError>` 로 통일 — FE/BE 공용 원시 스키마 포함.
> **위치**: `packages/shared/validation` · **상위**: [[architecture]]

## 책임 (Responsibility)

`@repo/utils`의 `Result`와 `@repo/errors`의 `AppError`를 조합해, Zod 검증 실패를 `AppError(VALIDATION)`로 자동 변환하는 `parse()` 함수를 제공한다. 또한 `Uuid`, `Email`, `Pagination` 같은 공유 원시 스키마를 정의해 중복 선언을 방지한다.

## 공개 API / export

| export | 종류 | 설명 |
|---|---|---|
| `Uuid` | Zod schema | `z.uuid()` — UUID 문자열 |
| `Email` | Zod schema | `z.email()` — 이메일 문자열 |
| `Pagination` | Zod schema | `{ page, perPage }` 기본값 포함 |
| `PaginationInput` | type | `z.input<typeof Pagination>` |
| `PaginationOutput` | type | `z.output<typeof Pagination>` |
| `fromZodError(err, msg?)` | fn | `ZodError` → `AppError(VALIDATION)` 변환 |
| `parse<T>(schema, data, msg?)` | fn | Zod safeParse → `Result<T, AppError>` |

## 의존

- 내부: [[shared-errors]], [[shared-utils]]
- 외부: `zod` (런타임 검증 — [[stack]])

## 사용 예

```ts
import { parse, Uuid } from "@repo/validation";
import { isOk } from "@repo/utils";

const result = parse(Uuid, req.params.id, "Invalid user ID");
if (!isOk(result)) {
  return res.status(400).json(result.error.toJSON());
}
```

## 연결된 개념

- [[adr/0010-validation-zod-result-integration]] — Zod + Result 통합 결정
- [[shared-errors]] — `AppError` 출력 타입
- [[shared-utils]] — `Result` 타입 기반
- [[shared-auth-contracts]] — `Uuid`, `Email` 스키마 재사용

> 소스: spec-02-03 · `packages/shared/validation/src/index.ts`
