import type { AuthenticatedUser } from "@repo/nestjs-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EmailChangeController } from "./email-change.controller.js";

const user: AuthenticatedUser = {
  sub: "user-001",
  role: "user",
  orgId: "org-001",
  orgRole: "owner",
};

function makeEmailChangeService() {
  return {
    requestEmailChange: vi.fn().mockResolvedValue(undefined),
    confirmEmailChange: vi.fn().mockResolvedValue("confirmed"),
  };
}

describe("EmailChangeController", () => {
  let emailChangeService: ReturnType<typeof makeEmailChangeService>;
  let controller: EmailChangeController;

  beforeEach(() => {
    emailChangeService = makeEmailChangeService();
    controller = new EmailChangeController(emailChangeService as never);
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
});
