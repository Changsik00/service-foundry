import { UnauthorizedException } from "@nestjs/common";
import { createInMemoryKeyStore } from "@repo/backend-auth-jwt";
import * as authPassword from "@repo/backend-auth-password";
import * as authSession from "@repo/backend-auth-session";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { UserStore } from "./password-reset.stores.js";
import type { SessionStore } from "./session.stores.js";
import { SigninService } from "./signin.service.js";

vi.mock("@repo/backend-auth-password", async (importOriginal) => {
  const mod = await importOriginal<typeof authPassword>();
  return { ...mod, verifyPassword: vi.fn() };
});

vi.mock("@repo/backend-auth-session", async (importOriginal) => {
  const mod = await importOriginal<typeof authSession>();
  return { ...mod, createSession: vi.fn() };
});

const mockUserRow = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "test@example.com",
  passwordHash: "$argon2id$fake",
  role: "user" as const,
  emailVerified: true,
  createdAt: new Date(),
};

const mockSessionResult = {
  session: {
    id: "sess-0001",
    userId: mockUserRow.id,
    refreshTokenHash: "hash123",
    refreshTokenFamily: "fam-0001",
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 24 * 3600_000),
    revokedAt: null,
  },
  refreshToken: "raw-refresh-token",
};

function makeUserStore(user: typeof mockUserRow | null = mockUserRow): UserStore {
  return {
    findByEmail: vi.fn().mockResolvedValue(user),
    findById: vi.fn().mockResolvedValue(user),
    updatePasswordHash: vi.fn(),
    updateEmailVerified: vi.fn(),
    insert: vi.fn(),
  };
}

function makeSessionStore(): SessionStore {
  return {
    insert: vi.fn(),
    findByHash: vi.fn(),
    updateRevoked: vi.fn(),
    bulkRevokeByFamily: vi.fn(),
  };
}

describe("SigninService", () => {
  beforeEach(() => {
    vi.mocked(authSession.createSession).mockResolvedValue(mockSessionResult);
  });

  it("성공 — 올바른 credentials → accessToken + user + refreshToken 반환", async () => {
    vi.mocked(authPassword.verifyPassword).mockResolvedValue(true);
    const keyStore = await createInMemoryKeyStore({ kid: "test-key" });
    const service = new SigninService(makeUserStore(), makeSessionStore(), {
      keyStore,
      issuer: "http://localhost:3000",
      audience: "http://localhost:3000",
    });

    const result = await service.signIn("test@example.com", "password123");

    expect(result.accessToken).toBeTruthy();
    expect(result.user.email).toBe("test@example.com");
    expect(result.refreshToken).toBe("raw-refresh-token");
  });

  it("email 없음 → UnauthorizedException", async () => {
    const keyStore = await createInMemoryKeyStore({ kid: "test-key" });
    const service = new SigninService(makeUserStore(null), makeSessionStore(), {
      keyStore,
      issuer: "http://localhost:3000",
      audience: "http://localhost:3000",
    });

    await expect(service.signIn("ghost@example.com", "password123")).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it("password 틀림 → UnauthorizedException", async () => {
    vi.mocked(authPassword.verifyPassword).mockResolvedValue(false);
    const keyStore = await createInMemoryKeyStore({ kid: "test-key" });
    const service = new SigninService(makeUserStore(), makeSessionStore(), {
      keyStore,
      issuer: "http://localhost:3000",
      audience: "http://localhost:3000",
    });

    await expect(service.signIn("test@example.com", "wrongpassword")).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
