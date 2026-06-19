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
  return { findById: vi.fn() };
}

describe("ProviderMeController", () => {
  let store: ReturnType<typeof makeStore>;
  let controller: ProviderMeController;

  beforeEach(() => {
    store = makeStore();
    controller = new ProviderMeController(store as never);
  });

  it("me → 프로필 조회 후 user 에 displayName/avatarUrl 병합", async () => {
    store.findById.mockResolvedValueOnce({ displayName: "홍길동", avatarUrl: "https://cdn/a.png" });
    const result = await controller.me(user);
    expect(store.findById).toHaveBeenCalledWith("user-001");
    expect(result.user).toMatchObject({
      sub: "user-001",
      displayName: "홍길동",
      avatarUrl: "https://cdn/a.png",
    });
  });

  it("me → 프로필 없으면 displayName/avatarUrl null 폴백", async () => {
    store.findById.mockResolvedValueOnce(undefined);
    const result = await controller.me(user);
    expect(result.user.displayName).toBeNull();
    expect(result.user.avatarUrl).toBeNull();
  });
});
