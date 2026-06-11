import { AppError } from "@repo/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockSignOut = vi.fn();
const mockGetUser = vi.fn();
const mockRefreshSession = vi.fn();

const mockClient = {
  auth: {
    signInWithPassword: mockSignInWithPassword,
    signUp: mockSignUp,
    signOut: mockSignOut,
    getUser: mockGetUser,
    refreshSession: mockRefreshSession,
  },
};

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => mockClient),
}));

const { createSupabaseAuthSDK } = await import("./index.js");

const TEST_CONFIG = { url: "https://test.supabase.co", anonKey: "anon-key" };

const MOCK_USER = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "test@example.com",
  created_at: "2026-01-01T00:00:00.000Z",
};

const MOCK_SESSION = {
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  access_token: "access",
  refresh_token: "refresh",
};

function makeAuthError(message: string, status: number) {
  return Object.assign(new Error(message), { __isAuthError: true, status });
}

describe("createSupabaseAuthSDK", () => {
  let sdk: ReturnType<typeof createSupabaseAuthSDK>;

  beforeEach(() => {
    vi.clearAllMocks();
    sdk = createSupabaseAuthSDK(TEST_CONFIG);
  });

  // ── signIn ──────────────────────────────────────────────────────────────

  describe("signIn", () => {
    it("성공 시 AuthResult { success: true } 반환", async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: MOCK_USER, session: MOCK_SESSION },
        error: null,
      });

      const result = await sdk.signIn({
        email: "test@example.com",
        password: "password123",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.user.id).toBe(MOCK_USER.id);
        expect(result.user.email).toBe(MOCK_USER.email);
        expect(result.user.role).toBe("user");
        expect(result.session.userId).toBe(MOCK_USER.id);
      }
    });

    it("Invalid login credentials → invalid_credentials", async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: makeAuthError("Invalid login credentials", 400),
      });

      const result = await sdk.signIn({
        email: "wrong@example.com",
        password: "wrong",
      });

      expect(result).toEqual({ success: false, reason: "invalid_credentials" });
    });

    it("Email rate limit exceeded → rate_limited", async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: makeAuthError("Email rate limit exceeded", 429),
      });

      const result = await sdk.signIn({
        email: "test@example.com",
        password: "pass",
      });

      expect(result).toEqual({ success: false, reason: "rate_limited" });
    });
  });

  // ── signUp ──────────────────────────────────────────────────────────────

  describe("signUp", () => {
    it("성공 시 AuthResult { success: true } 반환", async () => {
      mockSignUp.mockResolvedValue({
        data: { user: MOCK_USER, session: MOCK_SESSION },
        error: null,
      });

      const result = await sdk.signUp({
        email: "new@example.com",
        password: "password123",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.user.email).toBe(MOCK_USER.email);
      }
    });

    it("세션 없음 (이메일 확인 필요 프로젝트) → unverified_email (크래시 금지)", async () => {
      mockSignUp.mockResolvedValue({
        data: { user: MOCK_USER, session: null },
        error: null,
      });

      const result = await sdk.signUp({
        email: "new@example.com",
        password: "password123",
      });

      expect(result).toEqual({ success: false, reason: "unverified_email" });
    });

    it("User already registered → AppError CONFLICT throw", async () => {
      mockSignUp.mockResolvedValue({
        data: { user: null, session: null },
        error: makeAuthError("User already registered", 422),
      });

      await expect(
        sdk.signUp({ email: "exists@example.com", password: "password123" }),
      ).rejects.toThrow(AppError);
    });
  });

  // ── signOut ─────────────────────────────────────────────────────────────

  it("signOut — auth.signOut 위임", async () => {
    mockSignOut.mockResolvedValue({ error: null });
    await sdk.signOut();
    expect(mockSignOut).toHaveBeenCalledOnce();
  });

  // ── getCurrentUser ───────────────────────────────────────────────────────

  describe("getCurrentUser", () => {
    it("user 없으면 null 반환", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
      const user = await sdk.getCurrentUser();
      expect(user).toBeNull();
    });

    it("user 있으면 User 반환", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: MOCK_USER },
        error: null,
      });
      const user = await sdk.getCurrentUser();
      expect(user).not.toBeNull();
      expect(user?.id).toBe(MOCK_USER.id);
      expect(user?.role).toBe("user");
    });
  });

  // ── refresh ─────────────────────────────────────────────────────────────

  describe("refresh", () => {
    it("세션 없으면 null 반환", async () => {
      mockRefreshSession.mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      });
      const session = await sdk.refresh();
      expect(session).toBeNull();
    });

    it("세션 있으면 Session 반환", async () => {
      mockRefreshSession.mockResolvedValue({
        data: { user: MOCK_USER, session: MOCK_SESSION },
        error: null,
      });
      const session = await sdk.refresh();
      expect(session).not.toBeNull();
      expect(session?.userId).toBe(MOCK_USER.id);
      expect(session?.expiresAt).toBe(new Date(MOCK_SESSION.expires_at * 1000).toISOString());
    });
  });

  // ── supabase.rls ─────────────────────────────────────────────────────────

  it("supabase.rls — createClient 반환값 노출", () => {
    expect(sdk.supabase.rls).toBe(mockClient);
  });
});
