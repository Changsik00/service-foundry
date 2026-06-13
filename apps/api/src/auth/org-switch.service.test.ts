import { ForbiddenException } from "@nestjs/common";
import { createInMemoryKeyStore } from "@repo/backend-auth-jwt";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { JwtService } from "../jwt/jwt.service.js";
import { OrgSwitchService } from "./org-switch.service.js";

const USER_ID = "00000000-0000-0000-0000-000000000001";
const ORG_ID = "00000000-0000-0000-0000-000000000099";

function makeDatabase(membershipRole: string | null = "owner") {
  // pool.query 호출 순서: 1) memberships(role), 2) users(role).
  let n = 0;
  const mockQuery = vi.fn().mockImplementation(() => {
    n++;
    if (n === 1) {
      return Promise.resolve({ rows: membershipRole ? [{ role: membershipRole }] : [] });
    }
    return Promise.resolve({ rows: [{ role: "user" }] });
  });

  return {
    database: { pool: { query: mockQuery } },
    mocks: { mockQuery },
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

  it("멤버십 + 유저 role 조회(pool.query 2회)", async () => {
    const { database, mocks } = makeDatabase();
    const service = new OrgSwitchService(database as never, jwtService, jwtOpts);

    await service.switch(USER_ID, ORG_ID);

    // 1) memberships(인가) 2) users(role 클레임) — 가드가 role 을 요구하므로 토큰에 포함.
    expect(mocks.mockQuery).toHaveBeenCalledTimes(2);
  });
});
