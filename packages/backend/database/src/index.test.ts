import { isAppError } from "@repo/errors";
import type { Pool } from "pg";
import { describe, expect, it, vi } from "vitest";

import { createDatabase, migrate, shutdown } from "./index.js";

const migrateSpy = vi.fn().mockResolvedValue(undefined);

vi.mock("pg", () => {
  class PoolMock {
    public options: unknown;
    public end = vi.fn().mockResolvedValue(undefined);
    constructor(opts: unknown) {
      this.options = opts;
    }
  }
  return { Pool: PoolMock, default: { Pool: PoolMock } };
});

vi.mock("drizzle-orm/node-postgres", () => ({
  drizzle: vi.fn((pool: Pool, opts: unknown) => ({ _pool: pool, _opts: opts, _isDb: true })),
}));

vi.mock("drizzle-orm/node-postgres/migrator", () => ({
  migrate: (db: unknown, opts: unknown) => migrateSpy(db, opts),
}));

describe("createDatabase", () => {
  const schema = { users: { name: "users-table" } } as const;

  it("connectionUrl + schema 전달 시 { db, pool } 반환", () => {
    const result = createDatabase({
      connectionUrl: "postgres://localhost:5432/test",
      schema,
    });

    expect(result.pool).toBeDefined();
    expect(result.db).toBeDefined();
    expect((result.db as unknown as { _isDb: boolean })._isDb).toBe(true);
  });

  it("schema 가 drizzle 옵션으로 전달된다 (generic 통과)", () => {
    const result = createDatabase({
      connectionUrl: "postgres://localhost:5432/test",
      schema,
    });
    const opts = (result.db as unknown as { _opts: { schema: unknown } })._opts;
    expect(opts.schema).toBe(schema);
  });

  it("poolSize 옵션이 pg.Pool max 로 전달된다", () => {
    const result = createDatabase({
      connectionUrl: "postgres://localhost:5432/test",
      schema,
      poolSize: 25,
    });
    const options = (result.pool as unknown as { options: { max: number } }).options;
    expect(options.max).toBe(25);
  });
});

describe("shutdown", () => {
  it("pool.end() 가 호출된다", async () => {
    const { pool } = createDatabase({
      connectionUrl: "postgres://localhost:5432/test",
      schema: { x: 1 },
    });
    await shutdown(pool);
    expect((pool as unknown as { end: { mock: { calls: unknown[] } } }).end.mock.calls.length).toBe(
      1,
    );
  });
});

describe("migrate", () => {
  it("drizzle-kit migrate api 가 호출된다", async () => {
    migrateSpy.mockClear();
    const { db } = createDatabase({
      connectionUrl: "postgres://localhost:5432/test",
      schema: { x: 1 },
    });
    await migrate(db, { migrationsFolder: "./migrations" });
    expect(migrateSpy).toHaveBeenCalledTimes(1);
    expect(migrateSpy).toHaveBeenCalledWith(db, { migrationsFolder: "./migrations" });
  });

  it("drizzle-kit migrate 실패 시 AppError MIGRATION_FAILED throw", async () => {
    migrateSpy.mockClear();
    migrateSpy.mockRejectedValueOnce(new Error("DB locked"));
    const { db } = createDatabase({
      connectionUrl: "postgres://localhost:5432/test",
      schema: { x: 1 },
    });
    try {
      await migrate(db, { migrationsFolder: "./broken" });
      expect.fail("should have thrown");
    } catch (e) {
      expect(isAppError(e)).toBe(true);
      if (isAppError(e)) {
        expect(e.code).toBe("MIGRATION_FAILED");
        expect(e.statusCode).toBe(500);
      }
    }
  });
});
