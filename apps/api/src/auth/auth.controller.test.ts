import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AuthGuard } from "@repo/nestjs-auth";
import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthController } from "./auth.controller.js";
import { EmailVerifyService } from "./email-verify.service.js";
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
  return { cookies: cookie ? { refresh_token: cookie } : {} } as unknown as Request;
}

describe("AuthController", () => {
  let controller: AuthController;
  let signinService: SigninService;
  let signupService: SignupService;

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
          provide: PasswordResetService,
          useValue: { request: vi.fn(), confirm: vi.fn() },
        },
        {
          provide: EmailVerifyService,
          useValue: { request: vi.fn(), confirm: vi.fn() },
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = moduleRef.get(AuthController);
    signinService = moduleRef.get(SigninService);
    signupService = moduleRef.get(SignupService);
  });

  describe("POST /auth/signin", () => {
    it("성공 → accessToken + user 반환, cookie 설정", async () => {
      const res = makeMockRes();
      const result = await controller.signIn(
        { email: "test@example.com", password: "password123" },
        res,
      );
      expect(result.accessToken).toBe("access-tok-abc");
      expect(result.user.email).toBe("test@example.com");
      expect(res.cookie).toHaveBeenCalledWith(
        "refresh_token",
        "refresh-tok-xyz",
        expect.any(Object),
      );
    });

    it("잘못된 credentials → UnauthorizedException 전파", async () => {
      vi.mocked(signinService.signIn).mockRejectedValue(new UnauthorizedException());
      const res = makeMockRes();
      await expect(
        controller.signIn({ email: "test@example.com", password: "wrongpassword" }, res),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("POST /auth/signup", () => {
    it("성공 → accessToken + user 반환, cookie 설정", async () => {
      const res = makeMockRes();
      const result = await controller.signUp(
        { email: "new@example.com", password: "password123" },
        res,
      );
      expect(result.accessToken).toBe("access-tok-abc");
      expect(res.cookie).toHaveBeenCalled();
    });

    it("이메일 중복 → ConflictException 전파", async () => {
      vi.mocked(signupService.signUp).mockRejectedValue(new ConflictException());
      const res = makeMockRes();
      await expect(
        controller.signUp({ email: "dup@example.com", password: "password123" }, res),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe("POST /auth/signout", () => {
    it("cookie 삭제 + { status: ok } 반환", async () => {
      const res = makeMockRes();
      const req = makeMockReq("some-token");
      const result = await controller.signOut(req, res);
      expect(result).toEqual({ status: "ok" });
      expect(res.clearCookie).toHaveBeenCalledWith("refresh_token", { path: "/" });
    });
  });

  describe("POST /auth/refresh", () => {
    it("token rotation → 새 accessToken + cookie 설정", async () => {
      const res = makeMockRes();
      const req = makeMockReq("old-refresh-token");
      const result = await controller.refresh(req, res);
      expect(result.accessToken).toBe("access-tok-abc");
      expect(res.cookie).toHaveBeenCalled();
    });

    it("유효하지 않은 token → UnauthorizedException 전파", async () => {
      vi.mocked(signinService.refresh).mockRejectedValue(new UnauthorizedException());
      const res = makeMockRes();
      const req = makeMockReq("bad-token");
      await expect(controller.refresh(req, res)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("GET /auth/me", () => {
    it("currentUser → { user } 반환", () => {
      const currentUser = { sub: mockUserRow.id, role: "user" as const };
      const result = controller.me(currentUser);
      expect(result).toEqual({ user: currentUser });
    });
  });
});
