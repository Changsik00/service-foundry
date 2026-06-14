import type { INestApplication } from "@nestjs/common";
import { UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Test } from "@nestjs/testing";
import { AuthGuard, RolesGuard } from "@repo/nestjs-auth";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AdminController } from "./admin.controller.js";
import { AdminService, type OrgListResult, type UserListResult } from "./admin.service.js";
import { FeatureFlagService } from "./feature-flag.service.js";

const ORGS_RESULT: OrgListResult = {
  orgs: [
    {
      id: "org-1",
      name: "Acme",
      slug: "acme",
      isPersonal: false,
      ownerId: "u-1",
      createdAt: new Date("2024-01-01"),
    },
  ],
  nextCursor: null,
};

const USERS_RESULT: UserListResult = {
  users: [
    {
      id: "u-1",
      email: "alice@x.com",
      displayName: "Alice",
      role: "admin",
      orgId: "org-1",
      createdAt: new Date("2024-01-01"),
    },
  ],
  nextCursor: null,
};

function buildModule(userRole: "admin" | "user" | "unauth") {
  const listOrgsMock = vi.fn().mockResolvedValue(ORGS_RESULT);
  const listUsersMock = vi.fn().mockResolvedValue(USERS_RESULT);

  // AuthGuard mock: admin/user → 통과 + req.user 첨부, unauth → 401
  const authGuardValue =
    userRole === "unauth"
      ? {
          canActivate: () => {
            throw new UnauthorizedException();
          },
        }
      : {
          canActivate: (ctx: {
            switchToHttp: () => { getRequest: () => Record<string, unknown> };
          }) => {
            const req = ctx.switchToHttp().getRequest();
            req["user"] = { sub: "u-1", email: "alice@x.com", role: userRole, orgId: "org-1" };
            return true;
          },
        };

  const ffServiceMock = {
    list: vi.fn().mockResolvedValue([]),
    isEnabled: vi.fn().mockResolvedValue(true),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };

  return {
    module: Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        { provide: AdminService, useValue: { listOrgs: listOrgsMock, listUsers: listUsersMock } },
        { provide: FeatureFlagService, useValue: ffServiceMock },
        Reflector,
        { provide: RolesGuard, useClass: RolesGuard },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(authGuardValue),
    listOrgsMock,
    listUsersMock,
  };
}

describe("AdminController — 어드민 API (spec-21-01)", () => {
  describe("role=admin 유저", () => {
    let app: INestApplication;
    let listOrgsMock: ReturnType<typeof vi.fn>;
    let listUsersMock: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
      const { module, listOrgsMock: o, listUsersMock: u } = buildModule("admin");
      listOrgsMock = o;
      listUsersMock = u;
      const moduleRef = await module.compile();
      app = moduleRef.createNestApplication();
      await app.init();
    });

    afterEach(() => app.close());

    it("GET /admin/orgs → 200 + orgs 배열 반환", async () => {
      const res = await request(app.getHttpServer()).get("/admin/orgs").expect(200);
      expect(res.body).toMatchObject({ orgs: expect.any(Array), nextCursor: null });
      expect(listOrgsMock).toHaveBeenCalledOnce();
    });

    it("GET /admin/users → 200 + users 배열 반환", async () => {
      const res = await request(app.getHttpServer()).get("/admin/users").expect(200);
      expect(res.body).toMatchObject({ users: expect.any(Array), nextCursor: null });
      expect(listUsersMock).toHaveBeenCalledOnce();
    });

    it("GET /admin/orgs?search=acme → 서비스에 search 전달", async () => {
      await request(app.getHttpServer()).get("/admin/orgs?search=acme").expect(200);
      expect(listOrgsMock).toHaveBeenCalledWith(expect.objectContaining({ search: "acme" }));
    });

    it("GET /admin/users?limit=5 → 서비스에 limit 숫자로 전달", async () => {
      await request(app.getHttpServer()).get("/admin/users?limit=5").expect(200);
      expect(listUsersMock).toHaveBeenCalledWith(expect.objectContaining({ limit: 5 }));
    });
  });

  describe("role=user 유저 → 403 Forbidden", () => {
    let app: INestApplication;

    beforeEach(async () => {
      const { module } = buildModule("user");
      const moduleRef = await module.compile();
      app = moduleRef.createNestApplication();
      await app.init();
    });

    afterEach(() => app.close());

    it("GET /admin/orgs → 403", async () => {
      await request(app.getHttpServer()).get("/admin/orgs").expect(403);
    });

    it("GET /admin/users → 403", async () => {
      await request(app.getHttpServer()).get("/admin/users").expect(403);
    });
  });

  describe("미인증 → 401", () => {
    let app: INestApplication;

    beforeEach(async () => {
      const { module } = buildModule("unauth");
      const moduleRef = await module.compile();
      app = moduleRef.createNestApplication();
      await app.init();
    });

    afterEach(() => app.close());

    it("GET /admin/orgs → 401", async () => {
      await request(app.getHttpServer()).get("/admin/orgs").expect(401);
    });
  });
});
