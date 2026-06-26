import { ForbiddenException } from "@nestjs/common";
import type { TenantAls } from "@repo/backend-tenant";
import { describe, expect, it, vi } from "vitest";
import { ProviderOrgSwitchService } from "./provider-org-switch.service.js";

const USER_ID = "00000000-0000-0000-0000-000000000001"; // sub=내부 id (spec-x-auth-sub-normalize)
const ORG_ID = "00000000-0000-0000-0000-000000000099";
const ORG_PUBLIC = "org_PUBLICAAAAAAAAAAAAAAAA01";

function makeDatabase({
  org = [{ id: ORG_ID }],
  membership = [{ id: "m-1" }],
}: {
  org?: { id: string }[];
  membership?: { id: string }[];
} = {}) {
  // sub 정규화 후 select 순서: 1) organizations(public_id→id), 2) memberships(userId+orgId). (providerUid→user 조회 제거)
  let n = 0;
  const select = vi.fn().mockImplementation(() => {
    n++;
    const rows = n === 1 ? org : membership;
    return { from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(rows) }) };
  });
  const updateWhere = vi.fn().mockResolvedValue(undefined);
  const update = vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: updateWhere }) });
  return { database: { db: { select, update } }, mocks: { update, updateWhere } };
}

const als = { getStore: () => undefined } as unknown as TenantAls;

describe("ProviderOrgSwitchService", () => {
  it("membership 보유 org 로 전환 → users.orgId UPDATE + { orgId=public } 반환", async () => {
    const { database, mocks } = makeDatabase();
    const service = new ProviderOrgSwitchService(database as never, als);

    const result = await service.switch(USER_ID, ORG_PUBLIC);

    expect(result).toEqual({ orgId: ORG_PUBLIC });
    expect(mocks.update).toHaveBeenCalled();
  });

  it("membership 없음 → ForbiddenException + UPDATE 미실행", async () => {
    const { database, mocks } = makeDatabase({ membership: [] });
    const service = new ProviderOrgSwitchService(database as never, als);

    await expect(service.switch(USER_ID, ORG_PUBLIC)).rejects.toBeInstanceOf(ForbiddenException);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("org public_id 미존재 → ForbiddenException (fail-close)", async () => {
    const { database } = makeDatabase({ org: [] });
    const service = new ProviderOrgSwitchService(database as never, als);

    await expect(service.switch(USER_ID, ORG_PUBLIC)).rejects.toBeInstanceOf(ForbiddenException);
  });
});
