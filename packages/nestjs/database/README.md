# @repo/nestjs-database

> Drizzle DB 인스턴스를 `DATABASE` symbol provider로 전역 등록하고, 모듈 종료 시 커넥션 풀을 정리.

## 설치 / import
```ts
import { DatabaseModule, DATABASE, type Database } from "@repo/nestjs-database";
```

## 핵심 API
- `DatabaseModule.forRoot<TSchema>(options)` — Drizzle 인스턴스 생성 및 전역 DI 등록
- `DATABASE` — DI injection token (`@Inject(DATABASE)`)
- `Database` — Drizzle DB 인스턴스 타입 (re-export)
- `CreateDatabaseOptions` — DB 생성 옵션 타입 (re-export)
- `NodePgDatabase` — node-postgres 드라이버 타입 (re-export)

## 자세히
- 레퍼런스: [`docs/reference/packages/nestjs-database.md`](../../../docs/reference/packages/nestjs-database.md)
- 동작 원리: [`docs/explainers/platform/nestjs-adapter-module-pattern.md`](../../../docs/explainers/platform/nestjs-adapter-module-pattern.md)
