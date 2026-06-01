# @repo/contracts

> 인증 외 공통 API 계약 — `UserProfile`, 페이지네이션 스키마/코덱을 FE·BE 공유.

## 설치 / import

```ts
import { paginatedResponse } from "@repo/contracts/pagination";
import { UserProfile } from "@repo/contracts/user";
```

## 핵심 API

- `UserProfile` — `{ id, email, displayName, createdAt }` Zod 스키마 (`./user`)
- `PaginationQuery`, `CursorQuery` — offset / cursor 페이지네이션 입력 스키마 (`./pagination`)
- `paginatedResponse<T>(schema)` — offset 응답 envelope 스키마 생성기
- `cursorPaginatedResponse<T>(schema)` — cursor 응답 envelope 스키마 생성기
- `encodeCursor(value)` / `decodeCursor<T>(cursor)` — opaque base64 cursor 코덱

## 사용 예

```ts
import { paginatedResponse } from "@repo/contracts/pagination";
import { UserProfile } from "@repo/contracts/user";
import type { z } from "zod";

const UserListResponse = paginatedResponse(UserProfile);
type UserListResponse = z.output<typeof UserListResponse>;
```

## 자세히

- 레퍼런스: [`docs/reference/packages/shared-contracts.md`](../../../docs/reference/packages/shared-contracts.md)
