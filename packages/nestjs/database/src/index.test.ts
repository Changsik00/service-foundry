import { describe, expect, it, vi } from "vitest";

const { mockPoolEnd } = vi.hoisted(() => ({ mockPoolEnd: vi.fn().mockResolvedValue(undefined) }));

vi.mock("@repo/backend-database", () => ({
  createDatabase: vi.fn(() => ({
    db: { _isDb: true },
    pool: { end: mockPoolEnd },
  })),
  shutdown: vi.fn((pool: { end: () => Promise<void> }) => pool.end()),
}));

const { DATABASE, DatabaseModule } = await import("./index.js");

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

    const providers = mod.providers ?? [];
    // biome-ignore lint/suspicious/noExplicitAny: NestJS Provider union narrowing — test 검증용
    const providerTokens = providers.map((p: any) =>
      typeof p === "object" && "provide" in p ? p.provide : p,
    );
    expect(providerTokens).toContain(DATABASE);
    expect(mod.exports).toContain(DATABASE);

    const databaseProvider = providers.find(
      (p): p is { provide: symbol; useValue: unknown } =>
        typeof p === "object" && p !== null && "provide" in p && p.provide === DATABASE,
    );
    expect(databaseProvider).toBeDefined();
    expect(typeof databaseProvider?.useValue).toBe("object");
  });

  it("DatabaseModule.onModuleDestroy 호출 시 pool.end() 실행 (lifecycle hook 직접)", async () => {
    mockPoolEnd.mockClear();
    // forRoot 가 mocked createDatabase 호출 → currentDatabase 에 fake pool 저장
    DatabaseModule.forRoot({
      connectionUrl: "postgres://localhost:5432/test",
      schema: { x: 1 },
    });

    // NestJS 가 인스턴스 만들어서 lifecycle hook 호출 — 여기서는 직접 호출
    const instance = new DatabaseModule();
    await instance.onModuleDestroy();

    expect(mockPoolEnd).toHaveBeenCalledTimes(1);
  });
});
