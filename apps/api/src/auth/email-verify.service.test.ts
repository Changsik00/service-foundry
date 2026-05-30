import { Test } from "@nestjs/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NOTIFIER } from "../notification/notifier.provider.js";
import { EmailVerifyService } from "./email-verify.service.js";
import { EMAIL_VERIFY_TOKEN_STORE } from "./email-verify.stores.js";
import { USER_STORE } from "./password-reset.stores.js";

const makeUser = (id = "uid-1", email = "alice@example.com", emailVerified = false) => ({
  id,
  email,
  passwordHash: "hash",
  emailVerified,
  createdAt: new Date(),
});

describe("EmailVerifyService.request", () => {
  let service: EmailVerifyService;
  const userStore = {
    findByEmail: vi.fn(),
    updatePasswordHash: vi.fn(),
    updateEmailVerified: vi.fn(),
  };
  const tokenStore = { insert: vi.fn(), findByHash: vi.fn(), markUsed: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        EmailVerifyService,
        { provide: USER_STORE, useValue: userStore },
        { provide: EMAIL_VERIFY_TOKEN_STORE, useValue: tokenStore },
        { provide: NOTIFIER, useValue: { sendEmail: vi.fn() } },
      ],
    }).compile();
    service = module.get(EmailVerifyService);
  });

  it("인증 필요 user → token DB 저장, TTL = 24h ± 5초", async () => {
    userStore.findByEmail.mockResolvedValue(makeUser());
    tokenStore.insert.mockResolvedValue(undefined);
    const before = Date.now();

    await service.request("alice@example.com");

    expect(tokenStore.insert).toHaveBeenCalledOnce();
    const [[call]] = tokenStore.insert.mock.calls as unknown as [
      [{ tokenHash: string; expiresAt: Date; userId: string }],
    ];
    expect(call.tokenHash).toBeTypeOf("string");
    expect(call.tokenHash.length).toBeGreaterThan(0);
    expect(call.userId).toBe("uid-1");
    const diffMs = call.expiresAt.getTime() - before;
    expect(diffMs).toBeGreaterThanOrEqual(24 * 60 * 60_000 - 5000);
    expect(diffMs).toBeLessThanOrEqual(24 * 60 * 60_000 + 5000);
  });

  it("미존재 email → token 저장 없음 (enumeration-safe)", async () => {
    userStore.findByEmail.mockResolvedValue(null);

    await service.request("ghost@example.com");

    expect(tokenStore.insert).not.toHaveBeenCalled();
  });

  it("이미 인증된 user → token 저장 없음 (silent)", async () => {
    userStore.findByEmail.mockResolvedValue(makeUser("uid-1", "alice@example.com", true));

    await service.request("alice@example.com");

    expect(tokenStore.insert).not.toHaveBeenCalled();
  });
});
