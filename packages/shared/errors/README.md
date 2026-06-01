# @repo/errors

> `AppError` 클래스 + 표준 팩토리 함수 + JSON 직렬화/역직렬화 — 런타임 외부 의존성 없음.

## 설치 / import

```ts
import { notFoundError, isAppError, wrap, fromJSON } from "@repo/errors";
```

## 핵심 API

- `AppError` — `code / statusCode / details / cause` 포함 Error 서브클래스
- `notFoundError`, `validationError`, `unauthenticatedError`, `forbiddenError`, `conflictError`, `rateLimitError`, `internalError`, `badGatewayError` — 표준 팩토리 함수
- `isAppError(e)`, `isCode(e, code)` — 타입 가드
- `wrap(e, code?, msg?)` — unknown → AppError 변환
- `fromJSON(json)` — wire body → AppError 복원 (FE 사용)
- `errorMessage(e)` — unknown → 사람이 읽을 string 안전 추출

## 사용 예

```ts
import { notFoundError, isAppError, wrap, fromJSON } from "@repo/errors";

// 생성
throw notFoundError("User not found", { userId: "123" });

// catch 블록
catch (e) {
  const appErr = isAppError(e) ? e : wrap(e, "INTERNAL");
  res.status(appErr.statusCode).json(appErr.toJSON());
}

// FE에서 복원
const err = fromJSON(await res.json());
```

## 자세히

- 레퍼런스: [`docs/reference/packages/shared-errors.md`](../../../docs/reference/packages/shared-errors.md)
