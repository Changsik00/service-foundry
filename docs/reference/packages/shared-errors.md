---
type: reference
aliases: ["@repo/errors", "에러 패키지"]
tags: [service-foundry, reference, shared, errors]
---

# @repo/errors — FE/BE 공유 AppError 계층

> 💡 **한 줄 요약**: `AppError` 클래스 + 표준 팩토리 함수 + JSON 직렬화/역직렬화 — zod 외 런타임 의존성 없음.
> **위치**: `packages/shared/errors` · **상위**: [[architecture]]

## 책임 (Responsibility)

프론트엔드와 백엔드 양쪽에서 동일한 에러 표현을 사용할 수 있게 한다. `code` + `statusCode` + `details` 구조로 HTTP 시맨틱을 보존하며, `toJSON`/`fromJSON`으로 wire 포맷 왕복을 지원한다. `cause`는 직렬화에서 의도적으로 제외해 서버 내부 정보 노출을 방지한다.

## 공개 API / export

| export | 종류 | 설명 |
|---|---|---|
| `AppError` | class | code/statusCode/details/cause 포함 Error 서브클래스 |
| `AppErrorResponse` | type | `toJSON()` 출력 wire shape |
| `AppErrorInput` | type | 생성자 입력 타입 |
| `StandardErrorCode` | type | 표준 코드 유니온 (VALIDATION/NOT_FOUND 등) |
| `STANDARD_ERROR_REGISTRY` | const | 코드 → statusCode/title 매핑 |
| `isAppError(e)` | fn | AppError 인스턴스 가드 |
| `isCode(e, code)` | fn | 코드별 narrow 가드 |
| `isError(e)` | fn | cross-realm 안전 Error 가드 |
| `isAppErrorResponse(json)` | fn | duck-type wire 포맷 가드 |
| `errorMessage(e)` | fn | unknown → 사람이 읽을 string 안전 추출 |
| `errorCause(e)` | fn | cause 안전 추출 |
| `wrap(e, code?, msg?)` | fn | unknown → AppError 변환 |
| `fromJSON(json)` | fn | wire body → AppError 복원 |
| `validationError(msg, details?)` | fn | VALIDATION 팩토리 |
| `unauthenticatedError(msg, details?)` | fn | UNAUTHENTICATED 팩토리 |
| `forbiddenError(msg, details?)` | fn | FORBIDDEN 팩토리 |
| `notFoundError(msg, details?)` | fn | NOT_FOUND 팩토리 |
| `conflictError(msg, details?)` | fn | CONFLICT 팩토리 |
| `rateLimitError(msg, details?)` | fn | RATE_LIMIT 팩토리 |
| `internalError(msg, cause?)` | fn | INTERNAL 팩토리 |
| `badGatewayError(msg, cause?)` | fn | BAD_GATEWAY 팩토리 |

## 의존

- 내부: (없음 — `@repo/utils`는 devDependencies에만 존재)
- 외부: (없음)

## 사용 예

```ts
import { notFoundError, isAppError, fromJSON } from "@repo/errors";

// 생성
throw notFoundError("User not found", { userId: "123" });

// 변환 (catch 블록)
catch (e) {
  const appErr = isAppError(e) ? e : wrap(e, "INTERNAL");
  res.status(appErr.statusCode).json(appErr.toJSON());
}

// FE에서 복원
const err = fromJSON(await res.json());
```

## 연결된 개념

- [[adr/0009-app-error-design]] — 설계 결정 근거
- [[shared-utils]] — `Result<T, AppError>` 조합
- [[shared-validation]] — `fromZodError()` 가 `AppError` 반환

> 소스: spec-02-02 · `packages/shared/errors/src/index.ts`
