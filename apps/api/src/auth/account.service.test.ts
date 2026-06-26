import { BadRequestException } from "@nestjs/common";
import { createMemoryStorage } from "@repo/backend-storage";
import { describe, expect, it, vi } from "vitest";
import { AccountService } from "./account.service.js";
import type { AccountUserStore } from "./account.stores.js";
import type { SessionStore } from "./session.stores.js";

function makeStore(overrides: Partial<AccountUserStore> = {}): AccountUserStore {
  return {
    findById: vi.fn().mockResolvedValue(null),
    findByEmail: vi.fn().mockResolvedValue(null),
    findOrgPublicId: vi.fn().mockResolvedValue(null),
    updateDisplayName: vi.fn().mockResolvedValue(undefined),
    updatePasswordHash: vi.fn().mockResolvedValue(undefined),
    updateEmail: vi.fn().mockResolvedValue(undefined),
    softDelete: vi.fn().mockResolvedValue(undefined),
    isSoleOwnerOfAnyOrg: vi.fn().mockResolvedValue(false),
    updateAvatarUrl: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function makeSessionStore(): SessionStore {
  return {
    createSession: vi.fn(),
    findByRefreshToken: vi.fn(),
    findAllByUser: vi.fn(),
    revokeSession: vi.fn(),
    revokeAllByUser: vi.fn(),
    rotateSession: vi.fn(),
  } as unknown as SessionStore;
}

describe("AccountService.updateAvatar", () => {
  it("정상 업로드: storage.put → url → updateAvatarUrl 순 호출 후 url 반환", async () => {
    const storage = createMemoryStorage({ baseUrl: "https://cdn.example.com" });
    const updateAvatarUrl = vi.fn().mockResolvedValue(undefined);
    const store = makeStore({ updateAvatarUrl });
    const service = new AccountService(store, makeSessionStore(), storage);

    const buffer = Buffer.from([0xff, 0xd8, 0xff]); // JPEG magic bytes
    const url = await service.updateAvatar("user-1", buffer, "image/jpeg");

    expect(url).toBe("https://cdn.example.com/user-1");
    expect(updateAvatarUrl).toHaveBeenCalledWith("user-1", "https://cdn.example.com/user-1");
    const stored = await storage.get("user-1");
    expect(stored).not.toBeNull();
  });

  it("파일 크기 2 MB 초과 → BadRequestException", async () => {
    const storage = createMemoryStorage();
    const service = new AccountService(makeStore(), makeSessionStore(), storage);

    const big = Buffer.alloc(2 * 1024 * 1024 + 1);
    await expect(service.updateAvatar("user-1", big, "image/jpeg")).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it("허용되지 않은 MIME 타입 → BadRequestException", async () => {
    const storage = createMemoryStorage();
    const service = new AccountService(makeStore(), makeSessionStore(), storage);

    const buf = Buffer.from("fake");
    await expect(service.updateAvatar("user-1", buf, "application/pdf")).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
