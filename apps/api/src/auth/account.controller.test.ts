import { BadRequestException } from "@nestjs/common";
import type { AuthenticatedUser } from "@repo/nestjs-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccountController } from "./account.controller.js";

const user: AuthenticatedUser = {
  sub: "user-001",
  role: "user",
  orgId: "org-001",
  orgRole: "owner",
};

function makeAccountService() {
  return {
    changePassword: vi.fn().mockResolvedValue(undefined),
    updateProfile: vi.fn().mockResolvedValue(undefined),
    deleteAccount: vi.fn().mockResolvedValue(undefined),
    updateAvatar: vi.fn().mockResolvedValue("https://cdn.example/avatar/user-001.png"),
  };
}

function makeEmailChangeService() {
  return {
    requestEmailChange: vi.fn().mockResolvedValue(undefined),
    confirmEmailChange: vi.fn().mockResolvedValue("confirmed"),
  };
}

describe("AccountController", () => {
  let accountService: ReturnType<typeof makeAccountService>;
  let emailChangeService: ReturnType<typeof makeEmailChangeService>;
  let controller: AccountController;

  beforeEach(() => {
    accountService = makeAccountService();
    emailChangeService = makeEmailChangeService();
    controller = new AccountController(accountService as never, emailChangeService as never);
  });

  it("changePassword → accountService.changePassword(sub, current, new) 위임", async () => {
    const result = await controller.changePassword(
      { currentPassword: "Old@123", newPassword: "New@456" },
      user,
    );
    expect(accountService.changePassword).toHaveBeenCalledWith("user-001", "Old@123", "New@456");
    expect(result).toEqual({ status: "ok" });
  });

  it("updateProfile → accountService.updateProfile(sub, displayName) 위임", async () => {
    const result = await controller.updateProfile({ displayName: "홍길동" }, user);
    expect(accountService.updateProfile).toHaveBeenCalledWith("user-001", "홍길동");
    expect(result).toEqual({ status: "ok" });
  });

  it("deleteAccount → accountService.deleteAccount(sub) 위임", async () => {
    const result = await controller.deleteAccount(user);
    expect(accountService.deleteAccount).toHaveBeenCalledWith("user-001");
    expect(result).toEqual({ status: "ok" });
  });

  it("requestEmailChange → emailChangeService.requestEmailChange(sub, newEmail) 위임", async () => {
    const result = await controller.requestEmailChange({ newEmail: "new@example.com" }, user);
    expect(emailChangeService.requestEmailChange).toHaveBeenCalledWith(
      "user-001",
      "new@example.com",
    );
    expect(result).toEqual({ status: "ok" });
  });

  it("confirmEmailChange → emailChangeService 결과(outcome)를 status 로 그대로 반환", async () => {
    emailChangeService.confirmEmailChange.mockResolvedValueOnce("expired");
    const result = await controller.confirmEmailChange({ token: "t".repeat(20) });
    expect(emailChangeService.confirmEmailChange).toHaveBeenCalledWith("t".repeat(20));
    expect(result).toEqual({ status: "expired" });
  });

  describe("uploadAvatar", () => {
    const file = {
      fieldname: "avatar",
      originalname: "a.png",
      mimetype: "image/png",
      size: 1024,
      buffer: Buffer.from("img"),
    };

    it("정상 파일 → accountService.updateAvatar(sub, buffer, mimetype) 위임 + avatarUrl 반환", async () => {
      const result = await controller.uploadAvatar(file, user);
      expect(accountService.updateAvatar).toHaveBeenCalledWith(
        "user-001",
        file.buffer,
        "image/png",
      );
      expect(result).toEqual({
        status: "ok",
        avatarUrl: "https://cdn.example/avatar/user-001.png",
      });
    });

    it("파일 없음 → BadRequestException, 서비스 미호출", async () => {
      await expect(controller.uploadAvatar(undefined, user)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(accountService.updateAvatar).not.toHaveBeenCalled();
    });
  });
});
