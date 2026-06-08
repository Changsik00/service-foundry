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
  // select 순서: 1) memberships, 2) users(role).
  let n = 0;
  const mockSelect = vi.fn().mockImplementation(() => {
    n++;
    const rows = n === 1 ? (membership ? [membership] : []) : [{ role: "user" }];
    return { from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(rows) }) };
  });

  return {
    database: { db: { select: mockSelect } },
    mocks: { mockSelect },
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

  it("멤버십 + 유저 role 조회(select 2회)", async () => {
    const { database, mocks } = makeDatabase();
    const service = new OrgSwitchService(database as never, jwtService, jwtOpts);

    await service.switch(USER_ID, ORG_ID);

    // 1) memberships(인가) 2) users(role 클레임) — 가드가 role 을 요구하므로 토큰에 포함.
    expect(mocks.mockSelect).toHaveBeenCalledTimes(2);
  });
});
