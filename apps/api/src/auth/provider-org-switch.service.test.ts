import { ForbiddenException } from "@nestjs/common";
import type { TenantAls } from "@repo/backend-tenant";
import { describe, expect, it, vi } from "vitest";
import { ProviderOrgSwitchService } from "./provider-org-switch.service.js";

const PROVIDER_UID = "supabase-uid-123";
const USER_ID = "00000000-0000-0000-0000-000000000001";
const ORG_ID = "00000000-0000-0000-0000-000000000099";

function makeDatabase({
  org = [{ id: ORG_ID }],
  user = [{ id: USER_ID }],
  membership = [{ id: "m-1" }],
}: {
  org?: { id: string }[];
  user?: { id: string }[];
  membership?: { id: string }[];
} = {}) {
  // select 순서: 1) organizations(public_id→id), 2) users(providerUid), 3) memberships(userId+orgId)
  let n = 0;
  const select = vi.fn().mockImplementation(() => {
    n++;
    const rows = n === 1 ? org : n === 2 ? user : membership;
    return { from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(rows) }) };
  });
  const updateWhere = vi.fn().mockResolvedValue(undefined);
  const update = vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: updateWhere }) });
  return { database: { db: { select, update } }, mocks: { update, updateWhere } };
}

const als = { getStore: () => undefined } as unknown as TenantAls;

describe("ProviderOrgSwitchService", () => {
  it("membership 보유 org 로 전환 → users.orgId UPDATE + { orgId } 반환", async () => {
    const { database, mocks } = makeDatabase();
    const service = new ProviderOrgSwitchService(database as never, als);

    const result = await service.switch(PROVIDER_UID, ORG_ID);

    expect(result).toEqual({ orgId: ORG_ID });
    expect(mocks.update).toHaveBeenCalled();
  });

  it("membership 없음 → ForbiddenException + UPDATE 미실행", async () => {
    const { database, mocks } = makeDatabase({ membership: [] });
    const service = new ProviderOrgSwitchService(database as never, als);

    await expect(service.switch(PROVIDER_UID, ORG_ID)).rejects.toBeInstanceOf(ForbiddenException);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("유저 미해석 (providerUid 불일치) → ForbiddenException", async () => {
    const { database } = makeDatabase({ user: [] });
    const service = new ProviderOrgSwitchService(database as never, als);

    await expect(service.switch(PROVIDER_UID, ORG_ID)).rejects.toBeInstanceOf(ForbiddenException);
  });
});
