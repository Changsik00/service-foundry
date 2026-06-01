# @repo/validation

> `parse()` 함수로 Zod 스키마 검증 결과를 `Result<T, AppError>` 로 통일 — FE/BE 공용 원시 스키마 포함.

## 설치 / import

```ts
import { parse, Uuid, Email } from "@repo/validation";
```

## 핵심 API

- `parse<T>(schema, data, msg?)` — Zod safeParse → `Result<T, AppError>` 변환
- `fromZodError(err, msg?)` — `ZodError` → `AppError(VALIDATION)` 변환
- `Uuid` — `z.uuid()` 스키마
- `Email` — `z.email()` 스키마
- `Pagination` — `{ page, perPage }` 기본값 포함 스키마

## 사용 예

```ts
import { parse, Uuid } from "@repo/validation";
import { isOk } from "@repo/utils";

const result = parse(Uuid, req.params.id, "Invalid user ID");
if (!isOk(result)) {
  return res.status(400).json(result.error.toJSON());
}
```

## 자세히

- 레퍼런스: [`docs/reference/packages/shared-validation.md`](../../../docs/reference/packages/shared-validation.md)
