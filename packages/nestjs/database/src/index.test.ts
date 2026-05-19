import { describe, expect, it, vi } from "vitest";

const { mockPoolEnd } = vi.hoisted(() => ({ mockPoolEnd: vi.fn().mockResolvedValue(undefined) }));

vi.mock("pg", () => {
  class PoolMock {
    public end = mockPoolEnd;
    public options: unknown;
    constructor(opts: unknown) {
      this.options = opts;
    }
  }
  return { Pool: PoolMock, default: { Pool: PoolMock } };
});

vi.mock("drizzle-orm/node-postgres", () => ({
  drizzle: vi.fn((pool: unknown) => ({ _pool: pool, _isDb: true })),
}));

vi.mock("drizzle-orm/node-postgres/migrator", () => ({
  migrate: vi.fn(),
}));

const { DATABASE, DatabaseModule, DatabaseShutdownService } = await import("./index.js");

describe("DatabaseModule", () => {
  it("forRoot(options) → DynamicModule 구조 + DATABASE provider", () => {
    const mod = DatabaseModule.forRoot({
      connectionUrl: "postgres://localhost:5432/test",
      schema: { x: 1 },
    });
    expect(mod.module).toBe(DatabaseModule);
    expect(mod.global).toBe(true);
    expect(Array.isArray(mod.providers)).toBe(true);
    expect(Array.isArray(mod.exports)).toBe(true);

    const providerTokens = mod.providers.map((p) =>
      typeof p === "object" && "provide" in p ? p.provide : p,
    );
    expect(providerTokens).toContain(DATABASE);
    expect(mod.exports).toContain(DATABASE);

    const databaseProvider = mod.providers.find(
      (p): p is { provide: symbol; useValue: unknown } =>
        typeof p === "object" && p !== null && "provide" in p && p.provide === DATABASE,
    );
    expect(databaseProvider).toBeDefined();
    expect(typeof databaseProvider?.useValue).toBe("object");
  });

  it("DatabaseShutdownService.onModuleDestroy 호출 시 주입된 pool.end() 실행", async () => {
    const fakeEnd = vi.fn().mockResolvedValue(undefined);
    const fakeDatabase = { pool: { end: fakeEnd }, db: {} };
    // biome-ignore lint/suspicious/noExplicitAny: unit-level fake — DatabaseShutdownService 책임만 검증
    const shutdownService = new DatabaseShutdownService(fakeDatabase as any);
    await shutdownService.onModuleDestroy();
    expect(fakeEnd).toHaveBeenCalledTimes(1);
  });
});
