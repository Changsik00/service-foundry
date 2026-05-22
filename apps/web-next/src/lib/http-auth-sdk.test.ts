import type { User } from "@repo/auth-contracts";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createHttpAuthSDK } from "./http-auth-sdk";

const BASE_URL = "http://localhost:3001";

const mockUser: User = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "test@example.com",
  role: "user",
  createdAt: "2026-01-01T00:00:00.000Z",
};

function mockFetch(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
}

describe("createHttpAuthSDK", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("getCurrentUser", () => {
    it("초기값은 null이다", async () => {
      const sdk = createHttpAuthSDK(BASE_URL);
      expect(await sdk.getCurrentUser()).toBeNull();
    });
  });

  describe("signIn", () => {
    it("성공 시 AuthResult success + user를 반환하고 getCurrentUser에 저장한다", async () => {
      vi.stubGlobal("fetch", mockFetch(200, { accessToken: "token-abc", user: mockUser }));
      const sdk = createHttpAuthSDK(BASE_URL);

      const result = await sdk.signIn({ email: "test@example.com", password: "pw123456" });

      expect(result.success).toBe(true);
      if (result.success) expect(result.user).toEqual(mockUser);
      expect(await sdk.getCurrentUser()).toEqual(mockUser);
    });

    it("401 응답 시 invalid_credentials를 반환한다", async () => {
      vi.stubGlobal("fetch", mockFetch(401, { message: "Unauthorized" }));
      const sdk = createHttpAuthSDK(BASE_URL);

      const result = await sdk.signIn({ email: "bad@example.com", password: "wrongpw1" });

      expect(result).toEqual({ success: false, reason: "invalid_credentials" });
    });

    it("429 응답 시 rate_limited를 반환한다", async () => {
      vi.stubGlobal("fetch", mockFetch(429, { message: "Too Many Requests" }));
      const sdk = createHttpAuthSDK(BASE_URL);

      const result = await sdk.signIn({ email: "test@example.com", password: "pw123456" });

      expect(result).toEqual({ success: false, reason: "rate_limited" });
    });

    it("올바른 URL과 body로 fetch를 호출한다", async () => {
      const fetchMock = mockFetch(200, { accessToken: "t", user: mockUser });
      vi.stubGlobal("fetch", fetchMock);
      const sdk = createHttpAuthSDK(BASE_URL);

      await sdk.signIn({ email: "test@example.com", password: "pw123456" });

      expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: "test@example.com", password: "pw123456" }),
      });
    });
  });

  describe("signUp", () => {
    it("성공 시 AuthResult success + user를 반환하고 getCurrentUser에 저장한다", async () => {
      vi.stubGlobal("fetch", mockFetch(201, { accessToken: "token-xyz", user: mockUser }));
      const sdk = createHttpAuthSDK(BASE_URL);

      const result = await sdk.signUp({ email: "new@example.com", password: "newpw123" });

      expect(result.success).toBe(true);
      if (result.success) expect(result.user).toEqual(mockUser);
      expect(await sdk.getCurrentUser()).toEqual(mockUser);
    });
  });

  describe("signOut", () => {
    it("signOut 후 getCurrentUser가 null을 반환한다", async () => {
      vi.stubGlobal("fetch", mockFetch(200, { accessToken: "t", user: mockUser }));
      const sdk = createHttpAuthSDK(BASE_URL);
      await sdk.signIn({ email: "test@example.com", password: "pw123456" });

      vi.stubGlobal("fetch", mockFetch(200, { status: "ok" }));
      await sdk.signOut();

      expect(await sdk.getCurrentUser()).toBeNull();
    });
  });

  describe("refresh", () => {
    it("성공 시 Session을 반환하고 getCurrentUser를 갱신한다", async () => {
      vi.stubGlobal("fetch", mockFetch(200, { accessToken: "refreshed", user: mockUser }));
      const sdk = createHttpAuthSDK(BASE_URL);

      const session = await sdk.refresh();

      expect(session).not.toBeNull();
      expect(await sdk.getCurrentUser()).toEqual(mockUser);
    });

    it("401 응답 시 null을 반환한다", async () => {
      vi.stubGlobal("fetch", mockFetch(401, {}));
      const sdk = createHttpAuthSDK(BASE_URL);

      expect(await sdk.refresh()).toBeNull();
    });
  });
});
