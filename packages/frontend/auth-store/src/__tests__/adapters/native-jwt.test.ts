import { describe, expect, it, vi } from "vitest";
import { connectNativeJwt } from "../../adapters/native-jwt.js";
import { createAuthStore } from "../../store.js";

const validUser = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "user@example.com",
  role: "user" as const,
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("connectNativeJwt", () => {
  it("저장된 토큰 있고 refresh 성공 → authenticated", async () => {
    const store = createAuthStore();
    await connectNativeJwt(store, {
      getStoredToken: () => "stored_token",
      refresh: vi.fn().mockResolvedValue({ token: "fresh_token", user: validUser }),
    });
    expect(store.getState().status).toBe("authenticated");
    expect(store.getState().token).toBe("fresh_token");
    expect(store.getState().user).toEqual(validUser);
  });

  it("저장된 토큰 없음 → unauthenticated", async () => {
    const store = createAuthStore();
    await connectNativeJwt(store, {
      getStoredToken: () => null,
      refresh: vi.fn(),
    });
    expect(store.getState().status).toBe("unauthenticated");
    expect(store.getState().token).toBeNull();
  });

  it("저장된 토큰 있지만 refresh 실패 → unauthenticated", async () => {
    const store = createAuthStore();
    await connectNativeJwt(store, {
      getStoredToken: () => "expired_token",
      refresh: vi.fn().mockRejectedValue(new Error("expired")),
    });
    expect(store.getState().status).toBe("unauthenticated");
    expect(store.getState().token).toBeNull();
  });

  it("source.refresh → refresh 콜백 호출 후 token/user 갱신", async () => {
    const mockRefresh = vi
      .fn()
      .mockResolvedValueOnce({ token: "tok_1", user: validUser })
      .mockResolvedValueOnce({ token: "tok_2", user: validUser });
    const store = createAuthStore();
    const { source } = await connectNativeJwt(store, {
      getStoredToken: () => "stored",
      refresh: mockRefresh,
    });

    await source.refresh();
    expect(store.getState().token).toBe("tok_2");
    expect(mockRefresh).toHaveBeenCalledTimes(2);
  });
});
