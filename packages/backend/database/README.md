# @repo/backend-database

> PostgreSQL 연결 풀 생성, Drizzle 클라이언트 래핑, 마이그레이션 실행을 제공하는 하위 수준 인프라 패키지.

## 설치 / import
```ts
import { createDatabase, migrate, shutdown } from "@repo/backend-database";
```

## 핵심 API
- `createDatabase(options)` — PostgreSQL 풀 + Drizzle 클라이언트 팩토리, `{ db, pool }` 반환
- `migrate(db, options)` — drizzle-kit 마이그레이션 실행
- `shutdown(pool)` — 연결 풀 안전 종료

## 자세히
- 레퍼런스: [`docs/reference/packages/backend-database.md`](../../../docs/reference/packages/backend-database.md)
- 동작 원리: [`docs/explainers/backend/drizzle-migrations-lifecycle.md`](../../../docs/explainers/backend/drizzle-migrations-lifecycle.md)
