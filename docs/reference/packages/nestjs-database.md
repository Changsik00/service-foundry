---
type: reference
aliases: ["@repo/nestjs-database", "NestJS 데이터베이스 모듈"]
tags: [service-foundry, reference, nestjs, drizzle]
---

# @repo/nestjs-database — `backend-database` NestJS DI 어댑터

> 💡 **한 줄 요약**: Drizzle DB 인스턴스를 `DATABASE` symbol provider로 전역 등록하고, 모듈 종료 시 커넥션 풀을 정리.
> **위치**: `packages/nestjs/database` · **상위**: [[architecture]]

## 책임 (Responsibility)

`@repo/backend-database`의 `createDatabase()`로 Drizzle 인스턴스를 생성하고 NestJS DI 전역 provider로 등록한다. `OnModuleDestroy` 훅에서 `shutdown(pool)`을 호출해 graceful shutdown을 보장한다. Application/Domain 계층은 `DATABASE` token을 통해 인스턴스를 받고 ORM 세부 사항을 모른다.

## 공개 API / export

| export | 종류 | 설명 |
|---|---|---|
| `DATABASE` | symbol | DI injection token |
| `DatabaseModule` | class (`@Module`) | `forRoot<TSchema>(options)` static DynamicModule 팩토리 |
| `Database` | type (re-export) | Drizzle DB 인스턴스 타입 |
| `CreateDatabaseOptions` | type (re-export) | DB 생성 옵션 |
| `NodePgDatabase` | type (re-export) | node-postgres 드라이버 타입 |

## 의존

- 내부: `@repo/backend-database`
- 외부: `@nestjs/common`, `reflect-metadata`

## 사용 예

```ts
import { DatabaseModule, DATABASE, type Database } from "@repo/nestjs-database";
import * as schema from "./schema";

@Module({ imports: [DatabaseModule.forRoot({ connectionString: process.env.DATABASE_URL, schema })] })
export class AppModule {}

@Injectable()
class UserRepository {
  constructor(@Inject(DATABASE) private db: Database<typeof schema>) {}
}
```

## 연결된 개념

- [[adr/0015-framework-adapter-naming-and-layout]] — 어댑터 네이밍 규약
- [[adr/0016-nestjs-adapter-standard-module-pattern]] — 표준 Module 패턴
- [[explainers/platform/nestjs-adapter-module-pattern]] — 동작 원리

> 소스: spec-03-05 · `packages/nestjs/database/src/index.ts`
