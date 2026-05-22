import type { User } from "@repo/auth-contracts";
import { AppError } from "@repo/errors";
import { createHttpClient, type HttpClient } from "@repo/frontend-http-client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createHttpAuthSDK } from "./http-auth-sdk";

vi.mock("@repo/frontend-http-client");

const mockUser: User = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "test@example.com",
  role: "user",
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("createHttpAuthSDK", () => {
  let mockPost: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockPost = vi.fn();
    vi.mocked(createHttpClient).mockReturnValue({
      post: mockPost,
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      patch: vi.fn(),
      request: vi.fn(),
    } as unknown as HttpClient);
  });

  describe("getCurrentUser", () => {
    it("초기값은 null이다", async () => {
      const sdk = createHttpAuthSDK("http://localhost:3001");
      expect(await sdk.getCurrentUser()).toBeNull();
    });
  });

  describe("signIn", () => {
    it("성공 시 user를 저장하고 AuthResult success를 반환한다", async () => {
      mockPost.mockResolvedValueOnce({ accessToken: "token-abc", user: mockUser });
      const sdk = createHttpAuthSDK("http://localhost:3001");

      const result = await sdk.signIn({ email: "test@example.com", password: "pw123456" });

      expect(result.success).toBe(true);
      if (result.success) expect(result.user).toEqual(mockUser);
      expect(await sdk.getCurrentUser()).toEqual(mockUser);
    });

    it("401 에러 시 invalid_credentials를 반환한다", async () => {
      mockPost.mockRejectedValueOnce(
        new AppError({ code: "BAD_REQUEST", message: "401", statusCode: 401 }),
      );
      const sdk = createHttpAuthSDK("http://localhost:3001");

      const result = await sdk.signIn({ email: "bad@example.com", password: "wrongpw1" });

      expect(result).toEqual({ success: false, reason: "invalid_credentials" });
    });

    it("429 에러 시 rate_limited를 반환한다", async () => {
      mockPost.mockRejectedValueOnce(
        new AppError({ code: "RATE_LIMIT", message: "429", statusCode: 429 }),
      );
      const sdk = createHttpAuthSDK("http://localhost:3001");

      const result = await sdk.signIn({ email: "test@example.com", password: "pw123456" });

      expect(result).toEqual({ success: false, reason: "rate_limited" });
    });

    it("올바른 endpoint와 payload로 http.post를 호출한다", async () => {
      mockPost.mockResolvedValueOnce({ accessToken: "t", user: mockUser });
      const sdk = createHttpAuthSDK("http://localhost:3001");

      await sdk.signIn({ email: "test@example.com", password: "pw123456" });

      expect(mockPost).toHaveBeenCalledWith("auth/signin", {
        email: "test@example.com",
        password: "pw123456",
      });
    });
  });

  describe("signUp", () => {
    it("성공 시 user를 저장하고 AuthResult success를 반환한다", async () => {
      mockPost.mockResolvedValueOnce({ accessToken: "token-xyz", user: mockUser });
      const sdk = createHttpAuthSDK("http://localhost:3001");

      const result = await sdk.signUp({ email: "new@example.com", password: "newpw123" });

      expect(result.success).toBe(true);
      if (result.success) expect(result.user).toEqual(mockUser);
      expect(await sdk.getCurrentUser()).toEqual(mockUser);
    });
  });

  describe("signOut", () => {
    it("signOut 후 getCurrentUser가 null을 반환한다", async () => {
      mockPost
        .mockResolvedValueOnce({ accessToken: "t", user: mockUser })
        .mockResolvedValueOnce({ status: "ok" });
      const sdk = createHttpAuthSDK("http://localhost:3001");
      await sdk.signIn({ email: "test@example.com", password: "pw123456" });

      await sdk.signOut();

      expect(await sdk.getCurrentUser()).toBeNull();
    });
  });

  describe("refresh", () => {
    it("성공 시 Session을 반환하고 getCurrentUser를 갱신한다", async () => {
      mockPost.mockResolvedValueOnce({ accessToken: "refreshed", user: mockUser });
      const sdk = createHttpAuthSDK("http://localhost:3001");

      const session = await sdk.refresh();

      expect(session).not.toBeNull();
      expect(await sdk.getCurrentUser()).toEqual(mockUser);
    });

    it("에러 시 null을 반환한다", async () => {
      mockPost.mockRejectedValueOnce(
        new AppError({ code: "UNAUTHENTICATED", message: "401", statusCode: 401 }),
      );
      const sdk = createHttpAuthSDK("http://localhost:3001");

      expect(await sdk.refresh()).toBeNull();
    });
  });
});
