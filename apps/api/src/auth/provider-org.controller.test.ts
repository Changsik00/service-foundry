import { BadRequestException } from "@nestjs/common";
import type { AuthenticatedUser } from "@repo/nestjs-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProviderOrgController } from "./provider-org.controller.js";

const ORG_ID = "11111111-1111-4111-8111-111111111111";

const user: AuthenticatedUser = {
  sub: "user-001",
  role: "user",
  orgId: "org-001",
  orgRole: "owner",
};

function makeList() {
  return { listForProviderUid: vi.fn().mockResolvedValue([{ id: "org-001", name: "Acme" }]) };
}
function makeSwitch() {
  return { switch: vi.fn().mockResolvedValue({ orgId: ORG_ID }) };
}
function makeMembers() {
  return { list: vi.fn().mockResolvedValue({ members: [], nextCursor: null }) };
}
function makeInvite() {
  return {
    inviteForProvider: vi.fn().mockResolvedValue(undefined),
    acceptForProvider: vi.fn().mockResolvedValue({ orgId: ORG_ID }),
  };
}

describe("ProviderOrgController", () => {
  let orgList: ReturnType<typeof makeList>;
  let orgSwitch: ReturnType<typeof makeSwitch>;
  let orgMembers: ReturnType<typeof makeMembers>;
  let orgInvite: ReturnType<typeof makeInvite>;
  let controller: ProviderOrgController;

  beforeEach(() => {
    orgList = makeList();
    orgSwitch = makeSwitch();
    orgMembers = makeMembers();
    orgInvite = makeInvite();
    controller = new ProviderOrgController(
      orgList as never,
      orgSwitch as never,
      orgMembers as never,
      orgInvite as never,
    );
  });

  it("orgs → listForProviderUid(sub) 위임", async () => {
    const result = await controller.orgs(user);
    expect(orgList.listForProviderUid).toHaveBeenCalledWith("user-001");
    expect(result).toEqual({ orgs: [{ id: "org-001", name: "Acme" }] });
  });

  it("switch → 검증된 orgId 로 switch(sub, orgId) 위임", async () => {
    const result = await controller.switch({ orgId: ORG_ID }, user);
    expect(orgSwitch.switch).toHaveBeenCalledWith("user-001", ORG_ID);
    expect(result).toEqual({ orgId: ORG_ID });
  });

  it("members → 제공된 쿼리만 전달 (limit 숫자 변환)", async () => {
    await controller.members(user, "kim", "member", "cur-1", "20");
    expect(orgMembers.list).toHaveBeenCalledWith({
      orgId: "org-001",
      search: "kim",
      role: "member",
      cursor: "cur-1",
      limit: 20,
    });
  });

  it("invite → inviteForProvider(sub, orgId, email, role) 위임", async () => {
    const result = await controller.invite({ email: "invitee@example.com", role: "admin" }, user);
    expect(orgInvite.inviteForProvider).toHaveBeenCalledWith(
      "user-001",
      "org-001",
      "invitee@example.com",
      "admin",
    );
    expect(result).toEqual({ status: "ok" });
  });

  it("invite → active org 없으면 BadRequestException", async () => {
    const noOrg = { ...user, orgId: undefined } as unknown as AuthenticatedUser;
    await expect(
      controller.invite({ email: "invitee@example.com", role: "admin" }, noOrg),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(orgInvite.inviteForProvider).not.toHaveBeenCalled();
  });

  it("inviteAccept → acceptForProvider(sub, token) 위임", async () => {
    const token = "t".repeat(24);
    const result = await controller.inviteAccept({ token }, user);
    expect(orgInvite.acceptForProvider).toHaveBeenCalledWith("user-001", token);
    expect(result).toEqual({ orgId: ORG_ID });
  });
});
