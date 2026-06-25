import type { AuthenticatedUser } from "@repo/nestjs-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProviderMeController } from "./provider-me.controller.js";

const user: AuthenticatedUser = {
  sub: "user-001",
  role: "user",
  orgId: "org-001",
  orgRole: "owner",
};

function makeStore() {
  return { findById: vi.fn(), findByProviderUid: vi.fn() };
}

describe("ProviderMeController", () => {
  let store: ReturnType<typeof makeStore>;
  let controller: ProviderMeController;

  beforeEach(() => {
    store = makeStore();
    controller = new ProviderMeController(store as never);
  });

  it("me → public_id 식별자 + displayName/avatarUrl, 내부 sub 미노출", async () => {
    store.findById.mockResolvedValueOnce({
      publicId: "usr_ABCDEFGHJKMNPQRSTVWXYZ0123",
      email: "u@example.com",
      displayName: "홍길동",
      avatarUrl: "https://cdn/a.png",
    });
    const result = await controller.me(user);
    expect(store.findById).toHaveBeenCalledWith("user-001");
    expect(result.user).toEqual({
      id: "usr_ABCDEFGHJKMNPQRSTVWXYZ0123",
      email: "u@example.com",
      role: "user",
      orgId: "org-001",
      orgRole: "owner",
      displayName: "홍길동",
      avatarUrl: "https://cdn/a.png",
    });
    expect((result.user as Record<string, unknown>).sub).toBeUndefined();
  });

  it("me → findById 실패 시 providerUid 로 fallback 해석", async () => {
    store.findById.mockResolvedValueOnce(null);
    store.findByProviderUid.mockResolvedValueOnce({
      publicId: "usr_ZZZZZZZZZZZZZZZZZZZZZZ9999",
      email: "p@example.com",
      displayName: null,
      avatarUrl: null,
    });
    const result = await controller.me(user);
    expect(store.findByProviderUid).toHaveBeenCalledWith("user-001");
    expect(result.user.id).toBe("usr_ZZZZZZZZZZZZZZZZZZZZZZ9999");
  });

  it("me → 프로필 없으면 id/displayName/avatarUrl null 폴백", async () => {
    store.findById.mockResolvedValueOnce(null);
    store.findByProviderUid.mockResolvedValueOnce(null);
    const result = await controller.me(user);
    expect(result.user.id).toBeNull();
    expect(result.user.displayName).toBeNull();
    expect(result.user.avatarUrl).toBeNull();
  });
});
