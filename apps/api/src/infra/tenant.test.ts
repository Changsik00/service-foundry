import { AsyncLocalStorage } from "node:async_hooks";
import { describe, expect, it, vi } from "vitest";

import { withTenantContext } from "./tenant.js";

const ORG_ID = "00000000-0000-0000-0000-000000000099";

function makeTx() {
  const mockWhere = vi.fn().mockResolvedValue([{ id: "row-1" }]);
  const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
  const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
  const mockExecute = vi.fn().mockResolvedValue([]);

  const mockTx = { select: mockSelect, execute: mockExecute };
  const mockTransaction = vi
    .fn()
    .mockImplementation((cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx));

  return {
    db: { transaction: mockTransaction },
    mocks: { mockTransaction, mockExecute, mockSelect },
  };
}

describe("withTenantContext", () => {
  it("orgId 있으면 set_config 실행 후 fn 호출", async () => {
    const { db, mocks } = makeTx();

    await withTenantContext(db as never, ORG_ID, async (_tx) => {
      return undefined;
    });

    expect(mocks.mockTransaction).toHaveBeenCalledOnce();
    expect(mocks.mockExecute).toHaveBeenCalledOnce();
    const [sqlArg] = mocks.mockExecute.mock.calls[0] as [{ queryChunks?: unknown[] }];
    expect(JSON.stringify(sqlArg)).toContain("set_config");
  });

  it("orgId null 이면 set_config 미실행", async () => {
    const { db, mocks } = makeTx();

    await withTenantContext(db as never, null, async () => "ok");

    expect(mocks.mockTransaction).toHaveBeenCalledOnce();
    expect(mocks.mockExecute).not.toHaveBeenCalled();
  });

  it("fn 리턴값을 그대로 반환", async () => {
    const { db } = makeTx();

    const result = await withTenantContext(db as never, ORG_ID, async () => ({ data: 42 }));

    expect(result).toEqual({ data: 42 });
  });
});

describe("TenantAls", () => {
  it("AsyncLocalStorage 인스턴스", async () => {
    const { TenantAls } = await import("./tenant.js");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { AsyncLocalStorage: ALS } = await import("node:async_hooks");
    expect(new TenantAls()).toBeInstanceOf(ALS);
  });
});
