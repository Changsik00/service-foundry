import { beforeEach, describe, expect, it, vi } from "vitest";

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
    .mockImplementation((cb: (tx: typeof mockTx) => Promise<{ orgId: string; orgRole: string }>) =>
      cb(mockTx),
    );

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

const FIREBASE_UID = "firebase-uid-abc123xyz";
const INTERNAL_UUID = "00000000-0000-0000-0000-000000000002";

function makeProviderDatabase(existingUser?: Record<string, unknown> | null) {
  const selectLimit = vi.fn().mockResolvedValue(existingUser ? [existingUser] : []);
  const selectWhere = vi.fn().mockReturnValue({ limit: selectLimit });
  const selectFrom = vi.fn().mockReturnValue({ where: selectWhere });
  const mockSelect = vi.fn().mockReturnValue({ from: selectFrom });

  const mockMembershipValues = vi.fn().mockResolvedValue([]);
  const mockOrgReturning = vi.fn().mockResolvedValue([{ id: ORG_ID }]);
  const mockOrgValues = vi.fn().mockReturnValue({ returning: mockOrgReturning });
  const mockUserReturning = vi
    .fn()
    .mockResolvedValue([
      { id: INTERNAL_UUID, email: EMAIL, orgId: null, providerUid: FIREBASE_UID },
    ]);
  const mockUserValues = vi.fn().mockReturnValue({ returning: mockUserReturning });

  // 기존 유저 경로는 user insert 없이 org → membership 순서
  const mockInsert = existingUser
    ? vi
        .fn()
        .mockReturnValueOnce({ values: mockOrgValues })
        .mockReturnValueOnce({ values: mockMembershipValues })
    : vi
        .fn()
        .mockReturnValueOnce({ values: mockUserValues }) // 신규 유저: users insert
        .mockReturnValueOnce({ values: mockOrgValues })
        .mockReturnValueOnce({ values: mockMembershipValues });

  const mockWhere = vi.fn().mockResolvedValue([]);
  const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
  const mockUpdate = vi.fn().mockReturnValue({ set: mockSet });

  const mockTx = { select: mockSelect, insert: mockInsert, update: mockUpdate };
  const mockTransaction = vi
    .fn()
    .mockImplementation((cb: (tx: typeof mockTx) => unknown) => cb(mockTx));

  return {
    database: { db: { transaction: mockTransaction } },
    mocks: { mockSelect, selectWhere, selectLimit, mockInsert, mockUpdate, mockSet },
  };
}

describe("ProvisionService.provisionFromProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("신규 Firebase 유저 → 유저 생성 + org 생성 + internalUserId 반환", async () => {
    const { database } = makeProviderDatabase(null);
    const service = new ProvisionService(database as never);
    const result = await service.provisionFromProvider(FIREBASE_UID, EMAIL);
    expect(result).toEqual({ orgId: ORG_ID, orgRole: "owner", internalUserId: INTERNAL_UUID });
  });

  it("기존 Firebase 유저 (org 있음) → 유저/org 생성 없이 기존 orgId + internalUserId 반환", async () => {
    const { database, mocks } = makeProviderDatabase({
      id: INTERNAL_UUID,
      email: EMAIL,
      orgId: ORG_ID,
      providerUid: FIREBASE_UID,
    });
    const service = new ProvisionService(database as never);
    const result = await service.provisionFromProvider(FIREBASE_UID, EMAIL);
    expect(result).toEqual({ orgId: ORG_ID, orgRole: "owner", internalUserId: INTERNAL_UUID });
    expect(mocks.mockInsert).not.toHaveBeenCalled();
  });

  it("기존 Firebase 유저 (org 없음) → org만 생성 + internalUserId 반환", async () => {
    const { database } = makeProviderDatabase({
      id: INTERNAL_UUID,
      email: EMAIL,
      orgId: null,
      providerUid: FIREBASE_UID,
    });
    const service = new ProvisionService(database as never);
    const result = await service.provisionFromProvider(FIREBASE_UID, EMAIL);
    expect(result).toEqual({ orgId: ORG_ID, orgRole: "owner", internalUserId: INTERNAL_UUID });
  });
});

describe("ProvisionService", () => {
  it("provisionUser — 트랜잭션 내 3 쿼리 순서 실행", async () => {
    const { database, mocks } = makeDatabase();
    const service = new ProvisionService(database as never);

    const result = await service.provisionUser(USER_ID, EMAIL);

    expect(result).toEqual({ orgId: ORG_ID, orgRole: "owner" });
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
