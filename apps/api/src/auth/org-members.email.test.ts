import { describe, expect, it, vi } from "vitest";

import { OrgMembersService } from "./org-members.service.js";

const ROWS = [
  { userId: "u-1", orgId: "org-1", role: "owner", email: "a@x.com", displayName: null },
  { userId: "u-2", orgId: "org-1", role: "member", email: "b@x.com", displayName: null },
];

describe("OrgMembersService — email join (spec-x-org-api)", () => {
  it("멤버 목록에 email 이 포함된다 (users join)", async () => {
    const limit = vi.fn().mockResolvedValue(ROWS);
    const orderBy = vi.fn().mockReturnValue({ limit });
    const where = vi.fn().mockReturnValue({ orderBy });
    const joinChain: Record<string, unknown> = { where };
    const innerJoin = vi.fn().mockReturnValue(joinChain);
    joinChain.innerJoin = innerJoin;
    const from = vi.fn().mockReturnValue({ innerJoin });
    const select = vi.fn().mockReturnValue({ from });
    const service = new OrgMembersService({ db: { select } } as never);

    const result = await service.list();

    expect(result.members).toEqual(ROWS);
    expect(innerJoin).toHaveBeenCalled(); // memberships ⋈ users (email join)
  });
});
