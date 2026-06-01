---
type: reference
aliases: ["@repo/contracts", "공용 계약"]
tags: [service-foundry, reference, shared, contracts]
---

# @repo/contracts — 일반 도메인 공유 계약

> 💡 **한 줄 요약**: `UserProfile`, 페이지네이션 스키마/코덱 등 인증 외 공통 API 계약을 FE·BE 공유.
> **위치**: `packages/shared/contracts` · **상위**: [[architecture]]

## 책임 (Responsibility)

인증 외 도메인의 공유 Zod 스키마를 한 곳에서 관리한다. 서브경로 export(`./user`, `./pagination`)로 분리되어 있어 트리셰이킹이 용이하다. offset/cursor 양쪽 페이지네이션 패턴과 opaque cursor 코덱을 모두 제공한다.

## 공개 API / export

| export | 종류 | 설명 |
|---|---|---|
| `UserProfile` | Zod schema + type | `{ id, email, displayName, createdAt }` (`./user`) |
| `PaginationQuery` | Zod schema + type | `{ page, perPage }` offset 쿼리 (`./pagination`) |
| `CursorQuery` | Zod schema + type | `{ cursor?, limit }` cursor 쿼리 (`./pagination`) |
| `paginatedResponse<T>(schema)` | fn | offset 응답 envelope 스키마 생성기 (`./pagination`) |
| `cursorPaginatedResponse<T>(schema)` | fn | cursor 응답 envelope 스키마 생성기 (`./pagination`) |
| `encodeCursor(value)` | fn | `unknown` → base64 opaque cursor 문자열 (`./pagination`) |
| `decodeCursor<T>(cursor)` | fn | opaque cursor → `T \| null` (`./pagination`) |

## 의존

- 내부: [[shared-validation]] (`Uuid`, `Email`)
- 외부: `zod`

## 사용 예

```ts
import { paginatedResponse } from "@repo/contracts/pagination";
import { UserProfile } from "@repo/contracts/user";

const UserListResponse = paginatedResponse(UserProfile);
type UserListResponse = z.output<typeof UserListResponse>;
```

## 연결된 개념

- [[adr/0011-contracts-package-layout]] — 계약 패키지 레이아웃
- [[shared-auth-contracts]] — 인증 전용 계약 (병렬 패키지)
- [[shared-validation]] — 원시 스키마 공급

> 소스: spec-02-04, spec-13-01 · `packages/shared/contracts/src/`
