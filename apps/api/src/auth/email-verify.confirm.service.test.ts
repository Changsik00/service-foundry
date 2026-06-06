import { Test } from "@nestjs/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NOTIFIER } from "../notification/notifier.provider.js";
import { EmailVerifyService } from "./email-verify.service.js";
import { EMAIL_VERIFY_TOKEN_STORE } from "./email-verify.stores.js";
import { FRONTEND_URL } from "./frontend-url.token.js";
import { USER_STORE } from "./password-reset.stores.js";

const makeToken = (overrides: Record<string, unknown> = {}) => ({
  id: "tok-1",
  userId: "uid-1",
  tokenHash: "thash",
  expiresAt: new Date(Date.now() + 24 * 60 * 60_000),
  usedAt: null,
  createdAt: new Date(),
  ...overrides,
});

describe("EmailVerifyService.confirm", () => {
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
        { provide: FRONTEND_URL, useValue: "http://localhost:3000" },
      ],
    }).compile();
    service = module.get(EmailVerifyService);
  });

  it("유효 token → email_verified=true + used_at 설정", async () => {
    const token = "valid-token-string-123456789012345678901234";
    const validRow = makeToken();
    tokenStore.findByHash.mockResolvedValue(validRow);
    userStore.updateEmailVerified.mockResolvedValue(undefined);
    tokenStore.markUsed.mockResolvedValue(undefined);

    const outcome = await service.confirm(token);

    expect(outcome).toBe("confirmed");
    expect(userStore.updateEmailVerified).toHaveBeenCalledOnce();
    expect(userStore.updateEmailVerified).toHaveBeenCalledWith(validRow.userId);
    expect(tokenStore.markUsed).toHaveBeenCalledOnce();
    const [[id, usedAt]] = tokenStore.markUsed.mock.calls as unknown as [[string, Date]];
    expect(id).toBe(validRow.id);
    expect(usedAt).toBeInstanceOf(Date);
  });

  it("만료 token → 갱신 없음 (silent fail)", async () => {
    const token = "expired-token-string-123456789012345678901234";
    tokenStore.findByHash.mockResolvedValue(makeToken({ expiresAt: new Date(Date.now() - 1000) }));

    const outcome = await service.confirm(token);

    expect(outcome).toBe("expired");
    expect(userStore.updateEmailVerified).not.toHaveBeenCalled();
    expect(tokenStore.markUsed).not.toHaveBeenCalled();
  });

  it("재사용 token → 갱신 없음 (single-use)", async () => {
    const token = "used-token-string-123456789012345678901234";
    tokenStore.findByHash.mockResolvedValue(makeToken({ usedAt: new Date(Date.now() - 5000) }));

    const outcome = await service.confirm(token);

    expect(outcome).toBe("used");
    expect(userStore.updateEmailVerified).not.toHaveBeenCalled();
    expect(tokenStore.markUsed).not.toHaveBeenCalled();
  });

  it("미존재 token → 갱신 없음 (enumeration-safe)", async () => {
    const token = "unknown-token-string-123456789012345678901234";
    tokenStore.findByHash.mockResolvedValue(null);

    const outcome = await service.confirm(token);

    expect(outcome).toBe("invalid");
    expect(userStore.updateEmailVerified).not.toHaveBeenCalled();
    expect(tokenStore.markUsed).not.toHaveBeenCalled();
  });
});
