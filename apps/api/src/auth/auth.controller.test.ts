import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AuthEventBus } from "@repo/backend-auth-audit";
import { AuthGuard } from "@repo/nestjs-auth";
import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AUTH_METRICS } from "../metrics/auth-metrics.provider.js";
import { ACCOUNT_USER_STORE } from "./account.stores.js";
import { AuthController } from "./auth.controller.js";
import { CSRF_SECRET } from "./csrf.guard.js";
import { EmailVerifyService } from "./email-verify.service.js";
import { OrgInviteService } from "./org-invite.service.js";
import { OrgMembersService } from "./org-members.service.js";
import { OrgSwitchService } from "./org-switch.service.js";
import { PasswordResetService } from "./password-reset.service.js";
import { SigninService } from "./signin.service.js";
import { SignupService } from "./signup.service.js";

const mockUserRow = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "test@example.com",
  role: "user" as const,
  passwordHash: "$argon2id$fake",
  emailVerified: true,
  createdAt: new Date(),
};

const mockSigninResult = {
  accessToken: "access-tok-abc",
  user: mockUserRow,
  refreshToken: "refresh-tok-xyz",
};

function makeMockRes(): Response {
  return { cookie: vi.fn(), clearCookie: vi.fn() } as unknown as Response;
}

function makeMockReq(cookie?: string): Request {
  return {
    cookies: cookie ? { refresh_token: cookie } : {},
    ip: "1.2.3.4",
    headers: { "user-agent": "TestAgent/1.0" },
  } as unknown as Request;
}

describe("AuthController", () => {
  let controller: AuthController;
  let signinService: SigninService;
  let signupService: SignupService;
  let eventBus: AuthEventBus;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: SigninService,
          useValue: {
            signIn: vi.fn().mockResolvedValue(mockSigninResult),
            refresh: vi.fn().mockResolvedValue(mockSigninResult),
            revokeSession: vi.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: SignupService,
          useValue: {
            signUp: vi.fn().mockResolvedValue(mockSigninResult),
          },
        },
        {
          provide: OrgSwitchService,
          useValue: { switch: vi.fn() },
        },
        {
          provide: OrgInviteService,
          useValue: { invite: vi.fn(), accept: vi.fn() },
        },
        {
          provide: OrgMembersService,
          useValue: { list: vi.fn() },
        },
        {
          provide: PasswordResetService,
          useValue: { request: vi.fn(), confirm: vi.fn() },
        },
        {
          provide: EmailVerifyService,
          useValue: { request: vi.fn(), confirm: vi.fn() },
        },
        {
          provide: AuthEventBus,
          useValue: { emit: vi.fn() },
        },
        {
          provide: AUTH_METRICS,
          useValue: {
            recordLoginAttempt: vi.fn(),
            recordLoginSuccess: vi.fn(),
            recordLoginFailure: vi.fn(),
            metricsText: vi.fn(),
          },
        },
        {
          provide: CSRF_SECRET,
          useValue: "test-csrf-secret",
        },
        {
          provide: ACCOUNT_USER_STORE,
          useValue: {
            findById: vi.fn().mockResolvedValue({
              id: mockUserRow.id,
              email: mockUserRow.email,
              passwordHash: null,
              displayName: null,
            }),
            updateDisplayName: vi.fn(),
            updatePasswordHash: vi.fn(),
            softDelete: vi.fn(),
            isSoleOwnerOfAnyOrg: vi.fn().mockResolvedValue(false),
          },
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = moduleRef.get(AuthController);
    signinService = moduleRef.get(SigninService);
    signupService = moduleRef.get(SignupService);
    eventBus = moduleRef.get(AuthEventBus);
  });

  describe("POST /auth/signin", () => {
    it("성공 → accessToken + user 반환, cookie 설정", async () => {
      const res = makeMockRes();
      const req = makeMockReq();
      const result = await controller.signIn(
        { email: "test@example.com", password: "password123" },
        res,
        req,
      );
      if (!("accessToken" in result)) throw new Error("expected session result");
      expect(result.accessToken).toBe("access-tok-abc");
      expect(result.user.email).toBe("test@example.com");
      expect(res.cookie).toHaveBeenCalledWith(
        "refresh_token",
        "refresh-tok-xyz",
        expect.any(Object),
      );
    });

    it("성공 → SIGNED_IN 이벤트 emit", async () => {
      const res = makeMockRes();
      const req = makeMockReq();
      await controller.signIn({ email: "test@example.com", password: "password123" }, res, req);
      expect(eventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({ type: "SIGNED_IN", userId: mockUserRow.id }),
      );
    });

    it("잘못된 credentials → UnauthorizedException 전파 + LOGIN_FAILED emit", async () => {
      vi.mocked(signinService.signIn).mockRejectedValue(new UnauthorizedException());
      const res = makeMockRes();
      const req = makeMockReq();
      await expect(
        controller.signIn({ email: "test@example.com", password: "wrongpassword" }, res, req),
      ).rejects.toThrow(UnauthorizedException);
      expect(eventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({ type: "LOGIN_FAILED", email: "test@example.com" }),
      );
    });
  });

  describe("POST /auth/signup", () => {
    it("성공 → accessToken + user 반환, cookie 설정", async () => {
      const res = makeMockRes();
      const req = makeMockReq();
      const result = await controller.signUp(
        { email: "new@example.com", password: "password123" },
        res,
        req,
      );
      expect(result.accessToken).toBe("access-tok-abc");
      expect(res.cookie).toHaveBeenCalled();
    });

    it("성공 → SIGNED_IN 이벤트 emit", async () => {
      const res = makeMockRes();
      const req = makeMockReq();
      await controller.signUp({ email: "new@example.com", password: "password123" }, res, req);
      expect(eventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({ type: "SIGNED_IN", userId: mockUserRow.id }),
      );
    });

    it("이메일 중복 → ConflictException 전파", async () => {
      vi.mocked(signupService.signUp).mockRejectedValue(new ConflictException());
      const res = makeMockRes();
      const req = makeMockReq();
      await expect(
        controller.signUp({ email: "dup@example.com", password: "password123" }, res, req),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe("POST /auth/signout", () => {
    it("cookie 삭제 + { status: ok } 반환 + SIGNED_OUT emit", async () => {
      const res = makeMockRes();
      const req = makeMockReq("some-token");
      const result = await controller.signOut(req, res);
      expect(result).toEqual({ status: "ok" });
      expect(res.clearCookie).toHaveBeenCalledWith("refresh_token", { path: "/" });
      expect(eventBus.emit).toHaveBeenCalledWith(expect.objectContaining({ type: "SIGNED_OUT" }));
    });
  });

  describe("POST /auth/refresh", () => {
    it("token rotation → 새 accessToken + cookie 설정 + TOKEN_REFRESHED emit", async () => {
      const res = makeMockRes();
      const req = makeMockReq("old-refresh-token");
      const result = await controller.refresh(req, res);
      expect(result.accessToken).toBe("access-tok-abc");
      expect(res.cookie).toHaveBeenCalled();
      expect(eventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({ type: "TOKEN_REFRESHED" }),
      );
    });

    it("유효하지 않은 token → UnauthorizedException 전파", async () => {
      vi.mocked(signinService.refresh).mockRejectedValue(new UnauthorizedException());
      const res = makeMockRes();
      const req = makeMockReq("bad-token");
      await expect(controller.refresh(req, res)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("GET /auth/me", () => {
    it("currentUser → { user } 반환 (displayName 포함)", async () => {
      const currentUser = { sub: mockUserRow.id, role: "user" as const, orgId: null };
      const result = await controller.me(currentUser);
      expect(result).toEqual({ user: { ...currentUser, displayName: null } });
    });
  });
});
