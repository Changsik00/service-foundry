import { BadRequestException, ConflictException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { NOTIFIER } from "../notification/notifier.provider.js";
import { ACCOUNT_USER_STORE } from "./account.stores.js";
import { EmailChangeService } from "./email-change.service.js";
import { EMAIL_CHANGE_TOKEN_STORE } from "./email-change.stores.js";
import { FRONTEND_URL } from "./frontend-url.token.js";
import { SESSION_STORE } from "./session.stores.js";

const makeUser = (overrides: Record<string, unknown> = {}) => ({
  id: "uid-1",
  email: "alice@example.com",
  passwordHash: "$argon2id$hash",
  displayName: null,
  providerUid: null,
  ...overrides,
});

const makeToken = (overrides: Record<string, unknown> = {}) => ({
  id: "tok-1",
  userId: "uid-1",
  newEmail: "new@example.com",
  tokenHash: "thash",
  expiresAt: new Date(Date.now() + 24 * 60 * 60_000),
  usedAt: null,
  createdAt: new Date(),
  ...overrides,
});

describe("EmailChangeService", () => {
  let service: EmailChangeService;
  const userStore = {
    findById: vi.fn(),
    findByEmail: vi.fn(),
    updateDisplayName: vi.fn(),
    updatePasswordHash: vi.fn(),
    updateEmail: vi.fn(),
    softDelete: vi.fn(),
    isSoleOwnerOfAnyOrg: vi.fn(),
  };
  const tokenStore = { insert: vi.fn(), findByHash: vi.fn(), markUsed: vi.fn() };
  const sessionStore = { revokeAllByUser: vi.fn() };
  const notifier = { sendEmail: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        EmailChangeService,
        { provide: ACCOUNT_USER_STORE, useValue: userStore },
        { provide: EMAIL_CHANGE_TOKEN_STORE, useValue: tokenStore },
        { provide: SESSION_STORE, useValue: sessionStore },
        { provide: NOTIFIER, useValue: notifier },
        { provide: FRONTEND_URL, useValue: "http://localhost:3000" },
      ],
    }).compile();
    service = module.get(EmailChangeService);
  });

  describe("requestEmailChange", () => {
    it("providerUid 있는 사용자 → BadRequestException", async () => {
      userStore.findById.mockResolvedValue(makeUser({ providerUid: "google-uid-123" }));

      await expect(service.requestEmailChange("uid-1", "new@example.com")).rejects.toThrow(
        BadRequestException,
      );
      expect(tokenStore.insert).not.toHaveBeenCalled();
    });

    it("새 이메일 이미 사용 중 → ConflictException", async () => {
      userStore.findById.mockResolvedValue(makeUser());
      userStore.findByEmail.mockResolvedValue({ id: "uid-2" });

      await expect(service.requestEmailChange("uid-1", "taken@example.com")).rejects.toThrow(
        ConflictException,
      );
      expect(tokenStore.insert).not.toHaveBeenCalled();
    });

    it("정상 요청 → token DB 저장 + 새 이메일로 발송", async () => {
      userStore.findById.mockResolvedValue(makeUser());
      userStore.findByEmail.mockResolvedValue(null);
      tokenStore.insert.mockResolvedValue(undefined);
      notifier.sendEmail.mockResolvedValue(undefined);

      await service.requestEmailChange("uid-1", "new@example.com");

      expect(tokenStore.insert).toHaveBeenCalledOnce();
      const [[call]] = tokenStore.insert.mock.calls as unknown as [
        [{ userId: string; newEmail: string; tokenHash: string; expiresAt: Date }],
      ];
      expect(call.userId).toBe("uid-1");
      expect(call.newEmail).toBe("new@example.com");
      expect(call.tokenHash).toBeTypeOf("string");
      expect(call.expiresAt.getTime()).toBeGreaterThan(Date.now());

      expect(notifier.sendEmail).toHaveBeenCalledOnce();
      const [[emailCall]] = notifier.sendEmail.mock.calls as unknown as [
        [{ to: string; subject: string }],
      ];
      expect(emailCall.to).toBe("new@example.com");
    });
  });

  describe("confirmEmailChange", () => {
    it("미존재 token → 'invalid'", async () => {
      tokenStore.findByHash.mockResolvedValue(null);

      const result = await service.confirmEmailChange("nonexistent-token");
      expect(result).toBe("invalid");
      expect(userStore.updateEmail).not.toHaveBeenCalled();
    });

    it("만료된 token → 'expired'", async () => {
      tokenStore.findByHash.mockResolvedValue(
        makeToken({ expiresAt: new Date(Date.now() - 1000) }),
      );

      const result = await service.confirmEmailChange("expired-token");
      expect(result).toBe("expired");
      expect(userStore.updateEmail).not.toHaveBeenCalled();
    });

    it("이미 사용된 token → 'used'", async () => {
      tokenStore.findByHash.mockResolvedValue(makeToken({ usedAt: new Date() }));

      const result = await service.confirmEmailChange("used-token");
      expect(result).toBe("used");
      expect(userStore.updateEmail).not.toHaveBeenCalled();
    });

    it("정상 confirm → email 갱신 + markUsed + revokeAllByUser", async () => {
      tokenStore.findByHash.mockResolvedValue(makeToken());
      userStore.findByEmail.mockResolvedValue(null);
      userStore.updateEmail.mockResolvedValue(undefined);
      tokenStore.markUsed.mockResolvedValue(undefined);
      sessionStore.revokeAllByUser.mockResolvedValue(undefined);

      const result = await service.confirmEmailChange("valid-token");
      expect(result).toBe("confirmed");
      expect(userStore.updateEmail).toHaveBeenCalledWith("uid-1", "new@example.com");
      expect(tokenStore.markUsed).toHaveBeenCalledWith("tok-1", expect.any(Date));
      expect(sessionStore.revokeAllByUser).toHaveBeenCalledWith("uid-1");
    });
  });
});
