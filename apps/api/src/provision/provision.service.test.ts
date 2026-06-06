import { describe, expect, it, vi } from "vitest";

import { ProvisionService } from "./provision.service.js";

const ORG_ID = "00000000-0000-0000-0000-000000000099";
const USER_ID = "00000000-0000-0000-0000-000000000001";
const EMAIL = "alice@example.com";

function makeDatabase() {
  const mockWhere = vi.fn().mockResolvedValue([]);
  const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
  const mockUpdate = vi.fn().mockReturnValue({ set: mockSet });

  const mockMembershipValues = vi.fn().mockResolvedValue([]);
  const mockOrgReturning = vi.fn().mockResolvedValue([{ id: ORG_ID }]);
  const mockOrgValues = vi.fn().mockReturnValue({ returning: mockOrgReturning });

  const mockInsert = vi
    .fn()
    .mockReturnValueOnce({ values: mockOrgValues })
    .mockReturnValueOnce({ values: mockMembershipValues });

  const mockTx = { insert: mockInsert, update: mockUpdate };
  const mockTransaction = vi
    .fn()
    .mockImplementation((cb: (tx: typeof mockTx) => Promise<void>) => cb(mockTx));

  return {
    database: { db: { transaction: mockTransaction } },
    mocks: {
      mockTransaction,
      mockInsert,
      mockOrgValues,
      mockOrgReturning,
      mockMembershipValues,
      mockSet,
      mockUpdate,
    },
  };
}

describe("ProvisionService", () => {
  it("provisionUser — 트랜잭션 내 3 쿼리 순서 실행", async () => {
    const { database, mocks } = makeDatabase();
    const service = new ProvisionService(database as never);

    await service.provisionUser(USER_ID, EMAIL);

    expect(mocks.mockTransaction).toHaveBeenCalledOnce();
    expect(mocks.mockInsert).toHaveBeenCalledTimes(2);
    expect(mocks.mockOrgValues).toHaveBeenCalledWith(
      expect.objectContaining({
        isPersonal: true,
        ownerId: USER_ID,
        name: "alice",
        slug: expect.any(String),
      }),
    );
    expect(mocks.mockMembershipValues).toHaveBeenCalledWith({
      userId: USER_ID,
      orgId: ORG_ID,
      role: "owner",
    });
    expect(mocks.mockSet).toHaveBeenCalledWith({ orgId: ORG_ID });
  });
});
