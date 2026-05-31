import { Test } from "@nestjs/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NOTIFIER } from "../notification/notifier.provider.js";
import { PasswordResetService } from "./password-reset.service.js";
import { makeToken } from "./password-reset.service.test.js";
import { PASSWORD_RESET_TOKEN_STORE, USER_STORE } from "./password-reset.stores.js";

describe("PasswordResetService.confirm", () => {
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

  it("유효 token → password_hash 갱신 + used_at 설정", async () => {
    const token = "valid-token-string-123456789012345678901234";
    const validRow = makeToken({ tokenHash: "will-be-replaced-by-hash" });
    tokenStore.findByHash.mockResolvedValue(validRow);
    userStore.updatePasswordHash.mockResolvedValue(undefined);
    tokenStore.markUsed.mockResolvedValue(undefined);

    const outcome = await service.confirm(token, "newPassword123");

    expect(outcome).toBe("confirmed");
    expect(userStore.updatePasswordHash).toHaveBeenCalledOnce();
    expect(tokenStore.markUsed).toHaveBeenCalledOnce();
    const [[id, usedAt]] = tokenStore.markUsed.mock.calls as unknown as [[string, Date]];
    expect(id).toBe(validRow.id);
    expect(usedAt).toBeInstanceOf(Date);
  });

  it("만료 token → 갱신 없음 (silent fail)", async () => {
    const token = "expired-token-string-123456789012345678901234";
    const expiredRow = makeToken({ expiresAt: new Date(Date.now() - 1000) });
    tokenStore.findByHash.mockResolvedValue(expiredRow);

    const outcome = await service.confirm(token, "newPassword123");

    expect(outcome).toBe("expired");
    expect(userStore.updatePasswordHash).not.toHaveBeenCalled();
    expect(tokenStore.markUsed).not.toHaveBeenCalled();
  });

  it("재사용 token (used_at 존재) → 갱신 없음 (single-use)", async () => {
    const token = "used-token-string-123456789012345678901234";
    const usedRow = makeToken({ usedAt: new Date(Date.now() - 5000) });
    tokenStore.findByHash.mockResolvedValue(usedRow);

    const outcome = await service.confirm(token, "newPassword123");

    expect(outcome).toBe("used");
    expect(userStore.updatePasswordHash).not.toHaveBeenCalled();
    expect(tokenStore.markUsed).not.toHaveBeenCalled();
  });

  it("미존재 token → 갱신 없음 (enumeration-safe)", async () => {
    const token = "unknown-token-string-123456789012345678901234";
    tokenStore.findByHash.mockResolvedValue(null);

    const outcome = await service.confirm(token, "newPassword123");

    expect(outcome).toBe("invalid");
    expect(userStore.updatePasswordHash).not.toHaveBeenCalled();
    expect(tokenStore.markUsed).not.toHaveBeenCalled();
  });
});
