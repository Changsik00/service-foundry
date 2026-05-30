import { Test } from "@nestjs/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NOTIFIER } from "../notification/notifier.provider.js";
import { PasswordResetService } from "./password-reset.service.js";
import { PASSWORD_RESET_TOKEN_STORE, USER_STORE } from "./password-reset.stores.js";

const makeUser = (id = "uid-1", email = "alice@example.com") => ({
  id,
  email,
  passwordHash: "hash",
  emailVerified: false,
  createdAt: new Date(),
});

const makeToken = (overrides: Record<string, unknown> = {}) => ({
  id: "tok-1",
  userId: "uid-1",
  tokenHash: "thash",
  expiresAt: new Date(Date.now() + 15 * 60_000),
  usedAt: null,
  createdAt: new Date(),
  ...overrides,
});

describe("PasswordResetService.request", () => {
  let service: PasswordResetService;
  const userStore = { findByEmail: vi.fn(), updatePasswordHash: vi.fn() };
  const tokenStore = { insert: vi.fn(), findByHash: vi.fn(), markUsed: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        PasswordResetService,
        { provide: USER_STORE, useValue: userStore },
        { provide: PASSWORD_RESET_TOKEN_STORE, useValue: tokenStore },
        { provide: NOTIFIER, useValue: { sendEmail: vi.fn() } },
      ],
    }).compile();
    service = module.get(PasswordResetService);
  });

  it("존재하는 email → token_hash DB 저장", async () => {
    userStore.findByEmail.mockResolvedValue(makeUser());
    tokenStore.insert.mockResolvedValue(undefined);

    await service.request("alice@example.com");

    expect(tokenStore.insert).toHaveBeenCalledOnce();
    const [[call]] = tokenStore.insert.mock.calls as unknown as [
      [
        {
          tokenHash: string;
          expiresAt: Date;
          userId: string;
        },
      ],
    ];
    expect(call.tokenHash).toBeTypeOf("string");
    expect(call.tokenHash.length).toBeGreaterThan(0);
    expect(call.expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(call.userId).toBe("uid-1");
  });

  it("미존재 email → token 저장 없음 (enumeration-safe)", async () => {
    userStore.findByEmail.mockResolvedValue(null);

    await service.request("ghost@example.com");

    expect(tokenStore.insert).not.toHaveBeenCalled();
  });

  it("TTL = 15분 ± 5초", async () => {
    userStore.findByEmail.mockResolvedValue(makeUser());
    tokenStore.insert.mockResolvedValue(undefined);
    const before = Date.now();

    await service.request("alice@example.com");

    const [[{ expiresAt }]] = tokenStore.insert.mock.calls as unknown as [[{ expiresAt: Date }]];
    const diffMs = expiresAt.getTime() - before;
    expect(diffMs).toBeGreaterThanOrEqual(15 * 60_000 - 5000);
    expect(diffMs).toBeLessThanOrEqual(15 * 60_000 + 5000);
  });
});

export { makeToken, makeUser };
