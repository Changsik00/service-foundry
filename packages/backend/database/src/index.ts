/**
 * @repo/backend-database — Drizzle + node-postgres infrastructure factory.
 *
 * **본 패키지의 책임**: PostgreSQL pool 생성 + Drizzle client wrap + lifecycle helper.
 * **본 패키지가 *하지 않는* 것**: 도메인 schema 정의, repository 구현, query 로직.
 *
 * ## Repository 패턴 권장
 *
 * Application code 가 Drizzle (또는 향후 다른 ORM) 을 *직접 의존하지 않게*:
 *
 * ```text
 * apps/<app>/src/
 *   domain/<entity>/
 *     entity.ts                 # 도메인 POJO (ORM 모름)
 *     repository.ts             # interface SomeRepository
 *   infra/persistence/
 *     drizzle/
 *       schema/                 # Drizzle table defs (app-level)
 *       <entity>-repository.ts  # class DrizzleSomeRepository implements SomeRepository
 *   application/
 *     <use-case>.ts             # @Inject(SomeRepository) — ORM 모름
 * ```
 *
 * `DATABASE` symbol (from `@repo/nestjs-database`) 은 *infra layer 안에서만* 사용.
 * application/domain layer 는 repository interface 만 의존 → 향후 ORM 교체 시 *infra layer 만 변경*.
 *
 * 자세한 예제는 `apps/api` scaffold (spec-03-07) 참조.
 */
import type { Logger } from "@repo/backend-logger";
import { AppError } from "@repo/errors";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { migrate as drizzleKitMigrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

export type { NodePgDatabase } from "drizzle-orm/node-postgres";

export interface CreateDatabaseOptions<TSchema extends Record<string, unknown>> {
  connectionUrl: string;
  schema: TSchema;
  poolSize?: number;
  logger?: Logger;
  logQueries?: boolean;
}

export interface Database<TSchema extends Record<string, unknown>> {
  db: NodePgDatabase<TSchema>;
  pool: Pool;
}

export const createDatabase = <TSchema extends Record<string, unknown>>(
  options: CreateDatabaseOptions<TSchema>,
): Database<TSchema> => {
  const pool = new Pool({
    connectionString: options.connectionUrl,
    max: options.poolSize ?? 10,
  });

  const drizzleLogger =
    options.logQueries && options.logger
      ? {
          logQuery: (query: string, params: unknown[]) => {
            options.logger?.debug({ query, params }, "drizzle:query");
          },
        }
      : false;

  const db = drizzle(pool, { schema: options.schema, logger: drizzleLogger });
  return { db, pool };
};

export const shutdown = async (pool: Pool): Promise<void> => {
  await pool.end();
};

export interface MigrateOptions {
  migrationsFolder: string;
}

export const migrate = async <TSchema extends Record<string, unknown>>(
  db: NodePgDatabase<TSchema>,
  options: MigrateOptions,
): Promise<void> => {
  try {
    await drizzleKitMigrate(db, options);
  } catch (cause) {
    throw new AppError({
      code: "MIGRATION_FAILED",
      message: `drizzle migrate failed: ${options.migrationsFolder}`,
      statusCode: 500,
      cause,
    });
  }
};
