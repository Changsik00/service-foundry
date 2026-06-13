import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AuthGuard } from "@repo/nestjs-auth";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OrgInviteService } from "./org-invite.service.js";
import { OrgListService } from "./org-list.service.js";
import {
  type MemberListParams,
  type MemberListResult,
  OrgMembersService,
} from "./org-members.service.js";
import { ProviderOrgController } from "./provider-org.controller.js";
import { ProviderOrgSwitchService } from "./provider-org-switch.service.js";

const MEMBERS_RESULT: MemberListResult = {
  members: [
    { userId: "u-1", orgId: "org-1", role: "owner", email: "alice@x.com", displayName: "Alice" },
    { userId: "u-2", orgId: "org-1", role: "member", email: "bob@x.com", displayName: null },
  ],
  nextCursor: null,
};

describe("ProviderOrgController — GET /auth/org/members (spec-20-03)", () => {
  let app: INestApplication;
  let listMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    listMock = vi.fn().mockResolvedValue(MEMBERS_RESULT);

    const moduleRef = await Test.createTestingModule({
      controllers: [ProviderOrgController],
      providers: [
        { provide: OrgMembersService, useValue: { list: listMock } },
        { provide: OrgListService, useValue: { listForProviderUid: vi.fn() } },
        { provide: ProviderOrgSwitchService, useValue: { switch: vi.fn() } },
        {
          provide: OrgInviteService,
          useValue: { inviteForProvider: vi.fn(), acceptForProvider: vi.fn() },
        },
        {
          provide: AuthGuard,
          useValue: { canActivate: vi.fn().mockReturnValue(true) },
        },
      ],
    })
      // AuthGuard를 mock으로 대체 — JWT 없이도 통과
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it("파라미터 없이 호출 → 서비스에 빈 params 전달, 응답에 members + nextCursor 포함", async () => {
    const res = await request(app.getHttpServer()).get("/auth/org/members").expect(200);

    expect(res.body).toMatchObject({ members: expect.any(Array), nextCursor: null });
    expect(listMock).toHaveBeenCalledWith(
      expect.objectContaining({ search: undefined, role: undefined }),
    );
  });

  it("search 파라미터 → 서비스에 search 값 전달", async () => {
    await request(app.getHttpServer()).get("/auth/org/members?search=alice").expect(200);

    expect(listMock).toHaveBeenCalledWith(expect.objectContaining({ search: "alice" }));
  });

  it("role 파라미터 → 서비스에 role 값 전달", async () => {
    await request(app.getHttpServer()).get("/auth/org/members?role=owner").expect(200);

    expect(listMock).toHaveBeenCalledWith(expect.objectContaining({ role: "owner" }));
  });

  it("limit 파라미터 → 서비스에 limit 숫자로 전달", async () => {
    await request(app.getHttpServer()).get("/auth/org/members?limit=5").expect(200);

    expect(listMock).toHaveBeenCalledWith(expect.objectContaining({ limit: 5 }));
  });

  it("nextCursor 있는 응답 → 클라이언트에 그대로 전달", async () => {
    const withCursor: MemberListResult = {
      members: [MEMBERS_RESULT.members[0]!],
      nextCursor: "eyJ1c2VySWQiOiJ1LTEifQ==",
    };
    listMock.mockResolvedValueOnce(withCursor);

    const res = await request(app.getHttpServer()).get("/auth/org/members?limit=1").expect(200);

    expect(res.body.nextCursor).toBe("eyJ1c2VySWQiOiJ1LTEifQ==");
  });

  afterEach(async () => {
    await app.close();
  });
});
