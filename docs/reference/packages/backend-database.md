---
type: reference
aliases: ["@repo/backend-database", "Drizzle PostgreSQL 팩토리"]
tags: [service-foundry, reference, backend, drizzle]
---

# @repo/backend-database — Drizzle + node-postgres 연결 팩토리

> 💡 **한 줄 요약**: PostgreSQL 연결 풀 생성, Drizzle 클라이언트 래핑, 마이그레이션 실행을 제공하는 하위 수준 인프라 패키지.
> **위치**: `packages/backend/database` · **상위**: [[architecture]]

## 책임 (Responsibility)

`createDatabase`로 PostgreSQL 풀과 Drizzle 클라이언트를 생성하고 `Database<TSchema>` 타입으로 반환한다. `migrate`로 drizzle-kit 마이그레이션을 실행하며, `shutdown`으로 풀을 안전하게 종료한다. 도메인 스키마 정의나 repository 구현은 포함하지 않으며, 각 패키지·앱이 스키마를 제네릭으로 주입한다.

## 공개 API / export

| export | 종류 | 설명 |
|---|---|---|
| `createDatabase` | fn | PostgreSQL 풀 + Drizzle 클라이언트 팩토리 |
| `shutdown` | fn | 연결 풀 종료 |
| `migrate` | fn | drizzle-kit 마이그레이션 실행 |
| `Database` | type | `{ db, pool }` 반환 타입 |
| `CreateDatabaseOptions` | type | 팩토리 옵션 타입 |
| `MigrateOptions` | type | 마이그레이션 옵션 타입 |
| `NodePgDatabase` | type | Drizzle 타입 re-export |

## 의존

- 내부: [[backend-logger]] (`@repo/backend-logger`), [[shared-errors]] (`@repo/errors`)
- 외부: `drizzle-orm` (ORM 쿼리 빌더), `pg` (node-postgres 드라이버)

## 사용 예

```ts
import { createDatabase, migrate, shutdown } from "@repo/backend-database";

const { db, pool } = createDatabase({
  connectionUrl: process.env.DATABASE_URL!,
  schema: {},
  poolSize: 10,
  logQueries: true,
});
await migrate(db, { migrationsFolder: "./drizzle" });
// 종료 시:
await shutdown(pool);
```

## 연결된 개념

- [[explainers/backend/drizzle-migrations-lifecycle]] — 마이그레이션 생성·실행·롤백 흐름
- [[adr/0005-backend-framework-and-orm-strategy]] — Drizzle 단일 ORM 채택 결정
- [[backend-auth-session]] — 세션 스키마 등록 예시
- [[backend-auth-rate-limit]] — 실패 로그인 스키마 등록 예시

> 소스: spec-03-05 · `packages/backend/database/src/`
