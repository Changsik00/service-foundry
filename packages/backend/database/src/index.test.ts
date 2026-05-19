import type { Pool } from "pg";
import { describe, expect, it, vi } from "vitest";

import { createDatabase } from "./index.js";

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
