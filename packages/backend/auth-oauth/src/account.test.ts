import { describe, expect, it, vi } from "vitest";
import type { OAuthAccountStore, OAuthUserRow } from "./account.js";
import { findOrCreateOAuthUser } from "./account.js";
import type { OAuthUserInfo } from "./token.js";

const makeStore = (
  existingUser?: OAuthUserRow,
  existingAccount?: { userId: string },
): OAuthAccountStore => ({
  findUserByEmail: vi.fn(async () => existingUser),
  findOAuthAccount: vi.fn(async () => existingAccount),
  createUser: vi.fn(async (email: string) => ({
    id: "new-user-id",
    email,
    passwordHash: null,
    role: "user" as const,
    emailVerified: false,
    createdAt: new Date(),
  })),
  createOAuthAccount: vi.fn(async () => {}),
});

describe("findOrCreateOAuthUser", () => {
  const userInfo: OAuthUserInfo = {
    provider: "google",
    providerAccountId: "google-123",
    email: "new@example.com",
  };

  it("신규 이메일 → users + oauth_accounts 생성 (passwordHash = null, isNew = true)", async () => {
    const store = makeStore();

    const result = await findOrCreateOAuthUser(store, "google", userInfo);

    expect(result.isNew).toBe(true);
    expect(result.user.email).toBe("new@example.com");
    expect(result.user.passwordHash).toBeNull();
    expect(store.createUser).toHaveBeenCalledWith("new@example.com");
    expect(store.createOAuthAccount).toHaveBeenCalledWith("new-user-id", "google", "google-123");
  });

  it("기존 이메일 + 미연결 → oauth_accounts만 추가 (link, isNew = false)", async () => {
    const existing: OAuthUserRow = {
      id: "existing-id",
      email: "existing@example.com",
      passwordHash: "hash",
      role: "user",
      emailVerified: true,
      createdAt: new Date(),
    };
    const store = makeStore(existing, undefined);

    const result = await findOrCreateOAuthUser(store, "google", {
      provider: "google",
      providerAccountId: "google-456",
      email: "existing@example.com",
    });

    expect(result.isNew).toBe(false);
    expect(result.user.id).toBe("existing-id");
    expect(store.createUser).not.toHaveBeenCalled();
    expect(store.createOAuthAccount).toHaveBeenCalledWith("existing-id", "google", "google-456");
  });

  it("기존 연결 계정 → 기존 user 반환 (no-op, insert 없음)", async () => {
    const existing: OAuthUserRow = {
      id: "existing-id",
      email: "linked@example.com",
      passwordHash: "hash",
      role: "user",
      emailVerified: true,
      createdAt: new Date(),
    };
    const store = makeStore(existing, { userId: "existing-id" });

    const result = await findOrCreateOAuthUser(store, "google", {
      provider: "google",
      providerAccountId: "google-789",
      email: "linked@example.com",
    });

    expect(result.isNew).toBe(false);
    expect(result.user.id).toBe("existing-id");
    expect(store.createUser).not.toHaveBeenCalled();
    expect(store.createOAuthAccount).not.toHaveBeenCalled();
  });
});
