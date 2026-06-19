import type { AuthenticatedUser } from "@repo/nestjs-auth";
import type { Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MfaController } from "./mfa.controller.js";

const user: AuthenticatedUser = {
  sub: "user-001",
  role: "user",
  orgId: "org-001",
  orgRole: "owner",
};

function makeService() {
  return {
    enroll: vi.fn().mockResolvedValue({ totpUri: "otpauth://totp/x" }),
    confirmEnroll: vi.fn().mockResolvedValue({ backupCodes: ["a", "b"] }),
    verifyMfa: vi.fn().mockResolvedValue({ accessToken: "at-1", refreshToken: "rt-1" }),
    disable: vi.fn().mockResolvedValue(undefined),
  };
}

function makeRes() {
  return { cookie: vi.fn() } as unknown as Response;
}

describe("MfaController", () => {
  let service: ReturnType<typeof makeService>;
  let controller: MfaController;

  beforeEach(() => {
    service = makeService();
    controller = new MfaController(service as never);
  });

  it("enroll → enroll(sub) 위임", async () => {
    const result = await controller.enroll(user);
    expect(service.enroll).toHaveBeenCalledWith("user-001");
    expect(result).toEqual({ totpUri: "otpauth://totp/x" });
  });

  it("confirmEnroll → 검증된 code 로 confirmEnroll(sub, code) 위임", async () => {
    const result = await controller.confirmEnroll(user, { code: "123456" });
    expect(service.confirmEnroll).toHaveBeenCalledWith("user-001", "123456");
    expect(result).toEqual({ backupCodes: ["a", "b"] });
  });

  it("confirmEnroll → 너무 짧은 code 는 거부(throw), 서비스 미호출", async () => {
    await expect(controller.confirmEnroll(user, { code: "123" })).rejects.toBeTruthy();
    expect(service.confirmEnroll).not.toHaveBeenCalled();
  });

  it("verify → verifyMfa(token, code) 위임 + refresh 쿠키 설정 + accessToken 반환", async () => {
    const res = makeRes();
    const result = await controller.verify(
      { mfaChallengeToken: "challenge-token-1", code: "123456" },
      res,
    );
    expect(service.verifyMfa).toHaveBeenCalledWith("challenge-token-1", "123456");
    expect(res.cookie).toHaveBeenCalled();
    expect(result).toEqual({ accessToken: "at-1" });
  });

  it("disable → 검증된 code 로 disable(sub, code) 위임", async () => {
    const result = await controller.disable(user, { code: "123456" });
    expect(service.disable).toHaveBeenCalledWith("user-001", "123456");
    expect(result).toEqual({ status: "ok" });
  });
});
