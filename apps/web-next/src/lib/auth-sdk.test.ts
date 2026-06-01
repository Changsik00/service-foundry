import type { User } from "@repo/auth-contracts";
import { AppError } from "@repo/errors";
import { createHttpClient, type HttpClient } from "@repo/frontend-http-client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createAuthSDK } from "./auth-sdk";

vi.mock("@repo/frontend-http-client");

const mockUser: User = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "test@example.com",
  role: "user",
  createdAt: "2026-01-01T00:00:00.000Z",
};

const SIGN_RESPONSE = { accessToken: "token-abc", user: mockUser };

describe("createAuthSDK", () => {
  let mockPost: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockPost = vi.fn();
    vi.mocked(createHttpClient).mockReturnValue({
      post: mockPost,
      get: vi.fn().mockResolvedValue({ csrfToken: "csrf-test-token" }),
      put: vi.fn(),
      delete: vi.fn(),
      patch: vi.fn(),
      request: vi.fn(),
    } as unknown as HttpClient);
  });

  it("getCurrentUser — 초기값은 null", async () => {
    expect(await createAuthSDK("http://localhost:3001").getCurrentUser()).toBeNull();
  });

  describe("signIn", () => {
    it("성공 → user 저장 + AuthResult success", async () => {
      mockPost.mockResolvedValueOnce(SIGN_RESPONSE);
      const sdk = createAuthSDK("http://localhost:3001");

      const result = await sdk.signIn({ email: "test@example.com", password: "pw123456" });

      expect(result).toMatchObject({ success: true, user: mockUser });
      expect(await sdk.getCurrentUser()).toEqual(mockUser);
    });

    it("401 → invalid_credentials", async () => {
      mockPost.mockRejectedValueOnce(
        new AppError({ code: "BAD_REQUEST", message: "401", statusCode: 401 }),
      );

      const result = await createAuthSDK("http://localhost:3001").signIn({
        email: "bad@example.com",
        password: "wrongpw1",
      });

      expect(result).toEqual({ success: false, reason: "invalid_credentials" });
    });

    it("429 → rate_limited", async () => {
      mockPost.mockRejectedValueOnce(
        new AppError({ code: "RATE_LIMIT", message: "429", statusCode: 429 }),
      );

      const result = await createAuthSDK("http://localhost:3001").signIn({
        email: "test@example.com",
        password: "pw123456",
      });

      expect(result).toEqual({ success: false, reason: "rate_limited" });
    });

    it("올바른 endpoint + payload로 호출", async () => {
      mockPost.mockResolvedValueOnce(SIGN_RESPONSE);
      const sdk = createAuthSDK("http://localhost:3001");

      await sdk.signIn({ email: "test@example.com", password: "pw123456" });

      expect(mockPost).toHaveBeenCalledWith(
        "auth/signin",
        { email: "test@example.com", password: "pw123456" },
        expect.objectContaining({ schema: expect.anything() }),
      );
    });
  });

  describe("signUp", () => {
    it("성공 → user 저장 + AuthResult success", async () => {
      mockPost.mockResolvedValueOnce(SIGN_RESPONSE);
      const sdk = createAuthSDK("http://localhost:3001");

      const result = await sdk.signUp({ email: "new@example.com", password: "newpw123" });

      expect(result).toMatchObject({ success: true, user: mockUser });
      expect(await sdk.getCurrentUser()).toEqual(mockUser);
    });

    it("에러 → invalid_credentials", async () => {
      mockPost.mockRejectedValueOnce(
        new AppError({ code: "CONFLICT", message: "409", statusCode: 409 }),
      );

      const result = await createAuthSDK("http://localhost:3001").signUp({
        email: "dup@example.com",
        password: "newpw123",
      });

      expect(result).toEqual({ success: false, reason: "invalid_credentials" });
    });
  });

  describe("signOut", () => {
    it("signOut 후 getCurrentUser = null", async () => {
      mockPost
        .mockResolvedValueOnce(SIGN_RESPONSE) // signIn
        .mockResolvedValueOnce({ status: "ok" }); // signOut
      const sdk = createAuthSDK("http://localhost:3001");
      await sdk.signIn({ email: "test@example.com", password: "pw123456" });

      await sdk.signOut();

      expect(await sdk.getCurrentUser()).toBeNull();
    });
  });

  describe("refresh", () => {
    it("성공 → Session 반환 + getCurrentUser 갱신", async () => {
      mockPost.mockResolvedValueOnce(SIGN_RESPONSE);
      const sdk = createAuthSDK("http://localhost:3001");

      const session = await sdk.refresh();

      expect(session).toMatchObject({ userId: mockUser.id });
      expect(await sdk.getCurrentUser()).toEqual(mockUser);
    });

    it("에러 → null", async () => {
      mockPost.mockRejectedValueOnce(
        new AppError({ code: "UNAUTHENTICATED", message: "401", statusCode: 401 }),
      );

      expect(await createAuthSDK("http://localhost:3001").refresh()).toBeNull();
    });
  });
});
