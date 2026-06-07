/**
 * @repo/nestjs-database — `@repo/backend-database` 의 NestJS DI 어댑터.
 *
 * `DATABASE` symbol 은 *infra layer* 안에서만 사용:
 * - Drizzle Repository 구현체가 `@Inject(DATABASE)` 로 db 받음
 * - Application/Domain 은 *Repository interface* 만 의존 → ORM 모름
 *
 * 자세한 패턴은 `@repo/backend-database` 모듈 docstring 참조.
 *
 * ADR-0016: 표준 `@Module` class + `implements OnModuleDestroy` 직접 박음 (우회 class 없음).
 */
import { type DynamicModule, Module, type OnModuleDestroy } from "@nestjs/common";
import {
  type CreateDatabaseOptions,
  createDatabase,
  type Database,
  type NodePgDatabase,
  shutdown,
} from "@repo/backend-database";

export type { CreateDatabaseOptions, Database, NodePgDatabase } from "@repo/backend-database";
// 값 re-export: infra/테스트가 raw pool/factory 가 필요할 때 backend-database 직접 의존 없이 사용.
export { createDatabase, shutdown } from "@repo/backend-database";

export const DATABASE = Symbol("DATABASE");

@Module({})
export class DatabaseModule implements OnModuleDestroy {
  private static currentDatabase: Database<Record<string, unknown>> | undefined;

  static forRoot<TSchema extends Record<string, unknown>>(
    options: CreateDatabaseOptions<TSchema> & {
      /**
       * 제공되는 `DATABASE.db` 를 감싸는 변환(선택). adapter 는 변환 내용을 모른다 —
       * 예: 호출자가 요청 스코프 tenant 라우팅 proxy 를 주입(spec-17-07).
       * shutdown 은 원본 pool 을 그대로 사용한다.
       */
      wrapDb?: (db: NodePgDatabase<TSchema>) => NodePgDatabase<TSchema>;
    },
  ): DynamicModule {
    const { wrapDb, ...dbOptions } = options;
    const database = createDatabase(dbOptions);
    DatabaseModule.currentDatabase = database as Database<Record<string, unknown>>;
    const provided = wrapDb ? { ...database, db: wrapDb(database.db) } : database;
    return {
      module: DatabaseModule,
      providers: [{ provide: DATABASE, useValue: provided }],
      exports: [DATABASE],
      global: true,
    };
  }

  async onModuleDestroy(): Promise<void> {
    if (DatabaseModule.currentDatabase) {
      await shutdown(DatabaseModule.currentDatabase.pool);
    }
  }
}
