import type { INestApplication } from "@nestjs/common";
import { Controller, Get, UnauthorizedException, UseGuards } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Test } from "@nestjs/testing";
import { AuthGuard, Roles, RolesGuard } from "@repo/nestjs-auth";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AdminController } from "./admin.controller.js";
import { AdminService } from "./admin.service.js";
import { FeatureFlag } from "./feature-flag.decorator.js";
import { FeatureFlagGuard } from "./feature-flag.guard.js";
import { FeatureFlagService } from "./feature-flag.service.js";

const FLAG_A = {
  id: "flag-1",
  key: "new-dashboard",
  description: "신규 대시보드",
  enabled: true,
  createdAt: new Date("2024-01-01"),
};

const authGuardAdmin = {
  canActivate: (ctx: { switchToHttp: () => { getRequest: () => Record<string, unknown> } }) => {
    const req = ctx.switchToHttp().getRequest();
    req["user"] = { sub: "u-1", email: "alice@x.com", role: "admin", orgId: "org-1" };
    return true;
  },
};

const authGuardUnauth = {
  canActivate: () => {
    throw new UnauthorizedException();
  },
};

function makeFeatureFlagServiceMock(isEnabledResult = true) {
  return {
    list: vi.fn().mockResolvedValue([FLAG_A]),
    isEnabled: vi.fn().mockResolvedValue(isEnabledResult),
    create: vi.fn().mockResolvedValue(FLAG_A),
    update: vi.fn().mockResolvedValue({ ...FLAG_A, enabled: false }),
    remove: vi.fn().mockResolvedValue(undefined),
  };
}

function makeAdminServiceMock() {
  return {
    listOrgs: vi.fn().mockResolvedValue({ orgs: [], nextCursor: null }),
    listUsers: vi.fn().mockResolvedValue({ users: [], nextCursor: null }),
  };
}

async function buildApp(
  ffServiceMock: ReturnType<typeof makeFeatureFlagServiceMock>,
  authGuard = authGuardAdmin,
) {
  const moduleRef = await Test.createTestingModule({
    controllers: [AdminController],
    providers: [
      { provide: AdminService, useValue: makeAdminServiceMock() },
      { provide: FeatureFlagService, useValue: ffServiceMock },
      Reflector,
      { provide: RolesGuard, useClass: RolesGuard },
      { provide: FeatureFlagGuard, useClass: FeatureFlagGuard },
    ],
  })
    .overrideGuard(AuthGuard)
    .useValue(authGuard)
    .compile();

  const app = moduleRef.createNestApplication();
  await app.init();
  return app;
}

describe("AdminController — feature-flags CRUD (spec-21-02)", () => {
  let app: INestApplication;
  let ffService: ReturnType<typeof makeFeatureFlagServiceMock>;

  beforeEach(async () => {
    ffService = makeFeatureFlagServiceMock();
    app = await buildApp(ffService);
  });

  afterEach(() => app.close());

  it("GET /admin/feature-flags → 200 + 배열 반환", async () => {
    const res = await request(app.getHttpServer()).get("/admin/feature-flags").expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(ffService.list).toHaveBeenCalledOnce();
  });

  it("POST /admin/feature-flags → 201 + 생성된 플래그 반환", async () => {
    const res = await request(app.getHttpServer())
      .post("/admin/feature-flags")
      .send({ key: "new-dashboard", description: "신규 대시보드" })
      .expect(201);
    expect(res.body).toMatchObject({ key: "new-dashboard" });
    expect(ffService.create).toHaveBeenCalledWith("new-dashboard", "신규 대시보드");
  });

  it("PATCH /admin/feature-flags/:key → 200 + 업데이트된 플래그 반환", async () => {
    const res = await request(app.getHttpServer())
      .patch("/admin/feature-flags/new-dashboard")
      .send({ enabled: false })
      .expect(200);
    expect(res.body).toMatchObject({ key: "new-dashboard" });
    expect(ffService.update).toHaveBeenCalledWith("new-dashboard", false);
  });

  it("DELETE /admin/feature-flags/:key → 204", async () => {
    await request(app.getHttpServer()).delete("/admin/feature-flags/new-dashboard").expect(204);
    expect(ffService.remove).toHaveBeenCalledWith("new-dashboard");
  });
});

// FeatureFlagGuard 독립 테스트용 컨트롤러
@Controller("guarded")
class GuardedController {
  @Get()
  @FeatureFlag("my-feature")
  @UseGuards(FeatureFlagGuard)
  guarded() {
    return { ok: true };
  }
}

describe("FeatureFlagGuard (spec-21-02)", () => {
  it("플래그 비활성화 → 403", async () => {
    const ffService = makeFeatureFlagServiceMock(false);
    const moduleRef = await Test.createTestingModule({
      controllers: [GuardedController],
      providers: [
        { provide: FeatureFlagService, useValue: ffService },
        Reflector,
        FeatureFlagGuard,
      ],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer()).get("/guarded").expect(403);
    await app.close();
  });

  it("플래그 활성화 → 200", async () => {
    const ffService = makeFeatureFlagServiceMock(true);
    const moduleRef = await Test.createTestingModule({
      controllers: [GuardedController],
      providers: [
        { provide: FeatureFlagService, useValue: ffService },
        Reflector,
        FeatureFlagGuard,
      ],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer()).get("/guarded").expect(200);
    await app.close();
  });

  it("@FeatureFlag 없는 엔드포인트 → guard 통과 (200)", async () => {
    @Controller("open")
    class OpenController {
      @Get()
      @UseGuards(FeatureFlagGuard)
      open() {
        return { ok: true };
      }
    }

    const ffService = makeFeatureFlagServiceMock(false);
    const moduleRef = await Test.createTestingModule({
      controllers: [OpenController],
      providers: [
        { provide: FeatureFlagService, useValue: ffService },
        Reflector,
        FeatureFlagGuard,
      ],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer()).get("/open").expect(200);
    await app.close();
  });
});
