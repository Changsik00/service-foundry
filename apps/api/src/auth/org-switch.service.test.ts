import { ForbiddenException } from "@nestjs/common";
import { createInMemoryKeyStore } from "@repo/backend-auth-jwt";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { JwtService } from "../jwt/jwt.service.js";
import { OrgSwitchService } from "./org-switch.service.js";

const USER_ID = "00000000-0000-0000-0000-000000000001";
const ORG_ID = "00000000-0000-0000-0000-000000000099";

const mockMembership = {
  id: "mem-001",
  userId: USER_ID,
  orgId: ORG_ID,
  role: "owner" as const,
  createdAt: new Date(),
};

function makeDatabase(membership: typeof mockMembership | null = mockMembership) {
  const mockWhere = vi.fn().mockResolvedValue(membership ? [membership] : []);
  const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
  const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

  return {
    database: { db: { select: mockSelect } },
    mocks: { mockSelect, mockFrom, mockWhere },
  };
}

describe("OrgSwitchService", () => {
  let jwtService: JwtService;
  const jwtOpts = { issuer: "http://localhost:3000", audience: "http://localhost:3000" };

  beforeEach(async () => {
    const keyStore = await createInMemoryKeyStore({ kid: "test-key" });
    jwtService = { getKeyStore: () => keyStore } as unknown as JwtService;
  });

  it("유효한 멤버십 → 새 accessToken 발급", async () => {
    const { database } = makeDatabase();
    const service = new OrgSwitchService(database as never, jwtService, jwtOpts);

    const result = await service.switch(USER_ID, ORG_ID);

    expect(result.accessToken).toBeTruthy();
    expect(typeof result.accessToken).toBe("string");
  });

  it("멤버십 없음 → ForbiddenException", async () => {
    const { database } = makeDatabase(null);
    const service = new OrgSwitchService(database as never, jwtService, jwtOpts);

    await expect(service.switch(USER_ID, ORG_ID)).rejects.toThrow(ForbiddenException);
  });

  it("멤버십 있음 → select WHERE userId + orgId로 조회", async () => {
    const { database, mocks } = makeDatabase();
    const service = new OrgSwitchService(database as never, jwtService, jwtOpts);

    await service.switch(USER_ID, ORG_ID);

    expect(mocks.mockSelect).toHaveBeenCalledOnce();
    expect(mocks.mockFrom).toHaveBeenCalledOnce();
    expect(mocks.mockWhere).toHaveBeenCalledOnce();
  });
});
