import { BadRequestException } from "@nestjs/common";
import type { AuthenticatedUser } from "@repo/nestjs-auth";
import type { Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PasskeyController } from "./passkey.controller.js";

const CHALLENGE = "11111111-1111-4111-8111-111111111111";

const user: AuthenticatedUser = {
  sub: "user-001",
  role: "user",
  orgId: "org-001",
  orgRole: "owner",
};

function makeService() {
  return {
    generateRegisterOptions: vi
      .fn()
      .mockResolvedValue({ challengeToken: CHALLENGE, options: { rp: {} } }),
    verifyRegister: vi.fn().mockResolvedValue(undefined),
    generateAuthOptions: vi
      .fn()
      .mockResolvedValue({ challengeToken: CHALLENGE, options: { allowCredentials: [] } }),
    verifyAuth: vi.fn().mockResolvedValue({ accessToken: "at-1", refreshToken: "rt-1" }),
  };
}

function makeRes() {
  return { cookie: vi.fn() } as unknown as Response;
}

describe("PasskeyController", () => {
  let service: ReturnType<typeof makeService>;
  let controller: PasskeyController;

  beforeEach(() => {
    service = makeService();
    controller = new PasskeyController(service as never);
  });

  it("registerOptions → generateRegisterOptions(sub, sub) 위임", async () => {
    const result = await controller.registerOptions(user);
    expect(service.generateRegisterOptions).toHaveBeenCalledWith("user-001", "user-001");
    expect(result.challengeToken).toBe(CHALLENGE);
  });

  it("registerVerify → 검증 통과 시 verifyRegister(sub, token, credential) 위임", async () => {
    const credential = { id: "cred" };
    const result = await controller.registerVerify(user, {
      challengeToken: CHALLENGE,
      credential,
    });
    expect(service.verifyRegister).toHaveBeenCalledWith("user-001", CHALLENGE, credential);
    expect(result).toEqual({ status: "ok" });
  });

  it("registerVerify → challengeToken 비-uuid 면 BadRequestException, 서비스 미호출", async () => {
    await expect(
      controller.registerVerify(user, { challengeToken: "not-uuid", credential: {} }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(service.verifyRegister).not.toHaveBeenCalled();
  });

  it("authenticateOptions → generateAuthOptions() 위임", async () => {
    const result = await controller.authenticateOptions();
    expect(service.generateAuthOptions).toHaveBeenCalledTimes(1);
    expect(result.challengeToken).toBe(CHALLENGE);
  });

  it("authenticateVerify → verifyAuth 위임 + refresh 쿠키 설정 + accessToken 반환", async () => {
    const res = makeRes();
    const credential = { id: "cred" };
    const result = await controller.authenticateVerify(
      { challengeToken: CHALLENGE, credentialId: "cred-id", credential },
      res,
    );
    expect(service.verifyAuth).toHaveBeenCalledWith(CHALLENGE, "cred-id", credential);
    expect(res.cookie).toHaveBeenCalled();
    expect(result).toEqual({ accessToken: "at-1" });
  });

  it("authenticateVerify → credentialId 누락 시 BadRequestException", async () => {
    const res = makeRes();
    await expect(
      controller.authenticateVerify(
        { challengeToken: CHALLENGE, credentialId: "", credential: {} },
        res,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(service.verifyAuth).not.toHaveBeenCalled();
  });
});
