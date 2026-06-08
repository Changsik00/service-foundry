import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SuperuserGuard } from "./superuser-guard.provider.js";

function makeDb(rolsuper: boolean) {
  const execute = vi.fn().mockResolvedValue({ rows: [{ rolsuper }] });
  return { database: { db: { execute }, pool: {} } as never, execute };
}

describe("SuperuserGuard", () => {
  const prev = process.env.NODE_ENV;
  beforeEach(() => {
    process.env.NODE_ENV = "production";
  });
  afterEach(() => {
    process.env.NODE_ENV = prev;
  });

  it("production + 런타임이 슈퍼유저 → 기동 거부", async () => {
    const { database } = makeDb(true);
    const guard = new SuperuserGuard(database);
    await expect(guard.onApplicationBootstrap()).rejects.toThrow(/슈퍼유저/);
  });

  it("production + 비-슈퍼유저 → 통과", async () => {
    const { database } = makeDb(false);
    const guard = new SuperuserGuard(database);
    await expect(guard.onApplicationBootstrap()).resolves.toBeUndefined();
  });

  it("non-production 은 검사 안 함(DB 미조회)", async () => {
    process.env.NODE_ENV = "test";
    const { database, execute } = makeDb(true);
    const guard = new SuperuserGuard(database);
    await guard.onApplicationBootstrap();
    expect(execute).not.toHaveBeenCalled();
  });
});
