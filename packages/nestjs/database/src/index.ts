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
    options: CreateDatabaseOptions<TSchema>,
  ): DynamicModule {
    const database = createDatabase(options);
    DatabaseModule.currentDatabase = database as Database<Record<string, unknown>>;
    return {
      module: DatabaseModule,
      providers: [{ provide: DATABASE, useValue: database }],
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
