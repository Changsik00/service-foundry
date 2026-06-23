import { BadRequestException } from "@nestjs/common";
import type { AuthenticatedUser } from "@repo/nestjs-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OrgController } from "./org.controller.js";

const ORG_ID = "11111111-1111-4111-8111-111111111111";

const user: AuthenticatedUser = {
  sub: "user-001",
  role: "user",
  orgId: "org-001",
  orgRole: "owner",
};

function makeSwitch() {
  return { switch: vi.fn().mockResolvedValue({ accessToken: "at-new" }) };
}
function makeInvite() {
  return {
    invite: vi.fn().mockResolvedValue(undefined),
    accept: vi.fn().mockResolvedValue({ accessToken: "at-accept" }),
  };
}
function makeMembers() {
  return { list: vi.fn().mockResolvedValue({ members: [], nextCursor: null }) };
}

describe("OrgController", () => {
  let orgSwitch: ReturnType<typeof makeSwitch>;
  let orgInvite: ReturnType<typeof makeInvite>;
  let orgMembers: ReturnType<typeof makeMembers>;
  let controller: OrgController;

  beforeEach(() => {
    orgSwitch = makeSwitch();
    orgInvite = makeInvite();
    orgMembers = makeMembers();
    controller = new OrgController(orgSwitch as never, orgInvite as never, orgMembers as never);
  });

  it("orgSwitch → 검증된 orgId 로 switch(sub, orgId) 위임", async () => {
    const result = await controller.orgSwitch({ orgId: ORG_ID }, user);
    expect(orgSwitch.switch).toHaveBeenCalledWith("user-001", ORG_ID);
    expect(result).toEqual({ accessToken: "at-new" });
  });

  it("orgInvite → invite(sub, orgId, email, role) 위임", async () => {
    const result = await controller.orgInvite(
      { email: "invitee@example.com", role: "member" },
      user,
    );
    expect(orgInvite.invite).toHaveBeenCalledWith(
      "user-001",
      "org-001",
      "invitee@example.com",
      "member",
    );
    expect(result).toEqual({ status: "ok" });
  });

  it("orgInvite → active org 없으면 BadRequestException, invite 미호출", async () => {
    const noOrg = { ...user, orgId: undefined } as unknown as AuthenticatedUser;
    await expect(
      controller.orgInvite({ email: "invitee@example.com", role: "member" }, noOrg),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(orgInvite.invite).not.toHaveBeenCalled();
  });

  it("orgInviteAccept → accept(sub, token) 위임", async () => {
    const token = "t".repeat(24);
    const result = await controller.orgInviteAccept({ token }, user);
    expect(orgInvite.accept).toHaveBeenCalledWith("user-001", token);
    expect(result).toEqual({ accessToken: "at-accept" });
  });

  it("orgMembers → 제공된 쿼리만 list() 인자로 전달 (limit 은 숫자 변환)", async () => {
    await controller.orgMembers(user, "kim", "member", "cur-1", "10");
    expect(orgMembers.list).toHaveBeenCalledWith({
      search: "kim",
      role: "member",
      cursor: "cur-1",
      limit: 10,
    });
  });

  it("orgMembers → 미지정 쿼리는 list() 인자에서 생략", async () => {
    await controller.orgMembers(user);
    expect(orgMembers.list).toHaveBeenCalledWith({});
  });
});
