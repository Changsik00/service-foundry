import { describe, expect, it, vi } from "vitest";

import { OrgMembersService } from "./org-members.service.js";

const ROWS = [
  { userId: "u-1", orgId: "org-1", role: "owner", email: "a@x.com", displayName: null },
  { userId: "u-2", orgId: "org-1", role: "member", email: "b@x.com", displayName: null },
];

describe("OrgMembersService — email join (spec-x-org-api)", () => {
  it("멤버 목록에 email 이 포함된다 (users join)", async () => {
    const where = undefined; // RLS 자동 스코프 — where 없음 유지
    const innerJoin = vi.fn().mockResolvedValue(ROWS);
    const from = vi.fn().mockReturnValue({ innerJoin });
    const select = vi.fn().mockReturnValue({ from });
    const service = new OrgMembersService({ db: { select } } as never);

    const result = await service.list();

    expect(result.members).toEqual(ROWS);
    expect(innerJoin).toHaveBeenCalled(); // 명시 WHERE 없이 join 만 — RLS 검증 표면 유지
    void where;
  });
});
