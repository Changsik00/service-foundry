import { ForbiddenException } from "@nestjs/common";
import { createInMemoryKeyStore } from "@repo/backend-auth-jwt";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { JwtService } from "../jwt/jwt.service.js";
import { OrgSwitchService } from "./org-switch.service.js";

const USER_ID = "00000000-0000-0000-0000-000000000001";
const ORG_ID = "00000000-0000-0000-0000-000000000099";

function makeDatabase(membershipRole: string | null = "owner", orgFound = true) {
  // pool.query 호출 순서: 1) organizations(public_id→id), 2) memberships(role), 3) users(role).
  let n = 0;
  const mockQuery = vi.fn().mockImplementation(() => {
    n++;
    if (n === 1) return Promise.resolve({ rows: orgFound ? [{ id: ORG_ID }] : [] });
    if (n === 2) {
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

  it("org public_id 해석 + 멤버십 + 유저 role 조회(pool.query 3회)", async () => {
    const { database, mocks } = makeDatabase();
    const service = new OrgSwitchService(database as never, jwtService, jwtOpts);

    await service.switch(USER_ID, ORG_ID);

    // 1) organizations(public_id→id) 2) memberships(인가) 3) users(role 클레임).
    expect(mocks.mockQuery).toHaveBeenCalledTimes(3);
  });

  it("org public_id 미존재 → ForbiddenException (fail-close, ADR-0029)", async () => {
    const { database } = makeDatabase("owner", false);
    const service = new OrgSwitchService(database as never, jwtService, jwtOpts);

    await expect(service.switch(USER_ID, "org_NONEXISTENT000000000000")).rejects.toThrow(
      ForbiddenException,
    );
  });
});
