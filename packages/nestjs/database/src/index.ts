/**
 * @repo/nestjs-database — `@repo/backend-database` 의 NestJS DI 어댑터.
 *
 * `DATABASE` symbol 은 *infra layer* 안에서만 사용:
 * - Drizzle Repository 구현체가 `@Inject(DATABASE)` 로 db 받음
 * - Application/Domain 은 *Repository interface* 만 의존 → ORM 모름
 *
 * 자세한 패턴은 `@repo/backend-database` 모듈 docstring 참조.
 */
import type { OnModuleDestroy } from "@nestjs/common";
import {
  type CreateDatabaseOptions,
  createDatabase,
  type Database,
  shutdown,
} from "@repo/backend-database";

export type { CreateDatabaseOptions, Database, NodePgDatabase } from "@repo/backend-database";

export const DATABASE = Symbol("DATABASE");

/**
 * NestJS lifecycle hook: 컨테이너 destroy 시 pool graceful close.
 *
 * NestJS의 `OnModuleDestroy` 는 *provider class* 에서만 동작 — `useValue` 객체에
 * 박을 수 없음. 따라서 별 provider 로 박아 pool 보유 + onModuleDestroy 에서 shutdown.
 */
export class DatabaseShutdownService implements OnModuleDestroy {
  constructor(private readonly database: Database<Record<string, unknown>>) {}

  async onModuleDestroy(): Promise<void> {
    await shutdown(this.database.pool);
  }
}

interface DatabaseDynamicModuleProvider {
  provide: symbol | typeof DatabaseShutdownService;
  useValue?: unknown;
  useFactory?: (...args: unknown[]) => unknown;
  inject?: symbol[];
}

interface DatabaseDynamicModule {
  module: typeof DatabaseModule;
  providers: DatabaseDynamicModuleProvider[];
  exports: (symbol | typeof DatabaseShutdownService)[];
  global: true;
}

export const DatabaseModule = {
  forRoot<TSchema extends Record<string, unknown>>(
    options: CreateDatabaseOptions<TSchema>,
  ): DatabaseDynamicModule {
    const database = createDatabase(options);
    return {
      module: DatabaseModule,
      providers: [
        { provide: DATABASE, useValue: database },
        {
          provide: DatabaseShutdownService,
          useFactory: () =>
            new DatabaseShutdownService(database as Database<Record<string, unknown>>),
        },
      ],
      exports: [DATABASE],
      global: true,
    };
  },
};
