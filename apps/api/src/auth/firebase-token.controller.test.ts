import { ServiceUnavailableException } from "@nestjs/common";
import type { AuthenticatedUser } from "@repo/nestjs-auth";
import type { App } from "firebase-admin/app";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FirebaseTokenController } from "./firebase-token.controller.js";

const mockCreateCustomToken = vi.fn();

vi.mock("firebase-admin/auth", () => ({
  getAuth: () => ({
    createCustomToken: mockCreateCustomToken,
  }),
}));

const FAKE_APP = {} as App;

const mockUser: AuthenticatedUser = {
  sub: "user-uuid-001",
  role: "user",
  orgId: "org-uuid-001",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("FirebaseTokenController", () => {
  describe("FIREBASE_ADMIN_APP 있음", () => {
    it("유효한 사용자 → createCustomToken(sub, claims) 호출 후 { customToken } 반환", async () => {
      mockCreateCustomToken.mockResolvedValue("firebase-custom-token-xyz");
      const controller = new FirebaseTokenController(FAKE_APP);

      const result = await controller.issue(mockUser);

      expect(result).toEqual({ customToken: "firebase-custom-token-xyz" });
      expect(mockCreateCustomToken).toHaveBeenCalledWith("user-uuid-001", {
        active_org_id: "org-uuid-001",
        org_role: "user",
      });
    });
  });

  describe("FIREBASE_ADMIN_APP 없음 (브리지 미설정)", () => {
    it("ServiceUnavailableException (503) throw", async () => {
      const controller = new FirebaseTokenController(null);
      await expect(controller.issue(mockUser)).rejects.toThrow(ServiceUnavailableException);
    });
  });
});
