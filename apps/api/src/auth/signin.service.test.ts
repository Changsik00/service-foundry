import { HttpException, UnauthorizedException } from "@nestjs/common";
import { createInMemoryKeyStore } from "@repo/backend-auth-jwt";
import * as authPassword from "@repo/backend-auth-password";
import { createFakeRateLimitStore } from "@repo/backend-auth-rate-limit";
import * as authSession from "@repo/backend-auth-session";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { JwtService } from "../jwt/jwt.service.js";
import type { UserStore } from "./password-reset.stores.js";
import type { RateLimitStore } from "./rate-limit.stores.js";
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
    orgId: null,
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

const IP = "203.0.113.7";

describe("SigninService", () => {
  let jwtService: JwtService;
  let rateLimitStore: RateLimitStore;
  const jwtOpts = { issuer: "http://localhost:3000", audience: "http://localhost:3000" };

  function makeService(user: typeof mockUserRow | null = mockUserRow): SigninService {
    return new SigninService(
      makeUserStore(user),
      makeSessionStore(),
      jwtService,
      jwtOpts,
      rateLimitStore,
    );
  }

  beforeEach(async () => {
    vi.mocked(authSession.createSession).mockResolvedValue(mockSessionResult);
    const keyStore = await createInMemoryKeyStore({ kid: "test-key" });
    jwtService = { getKeyStore: () => keyStore } as unknown as JwtService;
    rateLimitStore = createFakeRateLimitStore();
  });

  it("성공 — 올바른 credentials → accessToken + user + refreshToken 반환", async () => {
    vi.mocked(authPassword.verifyPassword).mockResolvedValue(true);
    const result = await makeService().signIn("test@example.com", "password123", IP);

    expect(result.accessToken).toBeTruthy();
    expect(result.user.email).toBe("test@example.com");
    expect(result.refreshToken).toBe("raw-refresh-token");
  });

  it("email 없음 → UnauthorizedException", async () => {
    await expect(makeService(null).signIn("ghost@example.com", "password123", IP)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it("password 틀림 → UnauthorizedException", async () => {
    vi.mocked(authPassword.verifyPassword).mockResolvedValue(false);
    await expect(makeService().signIn("test@example.com", "wrongpassword", IP)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it("동일 계정 5회 실패 → 6회차 429 (lockout)", async () => {
    vi.mocked(authPassword.verifyPassword).mockResolvedValue(false);
    const service = makeService();

    for (let i = 0; i < 5; i++) {
      await expect(service.signIn("victim@example.com", "wrong", IP)).rejects.toThrow(
        UnauthorizedException,
      );
    }
    // 6회차: 잠금 → 429 (UnauthorizedException 아님)
    await expect(service.signIn("victim@example.com", "wrong", IP)).rejects.toThrow(HttpException);
    await expect(service.signIn("victim@example.com", "wrong", IP)).rejects.toMatchObject({
      status: 429,
    });
  });

  it("성공 시 recordSuccess — 실패 누적(<임계) 후 정상 로그인 + 카운터 리셋", async () => {
    const service = makeService();

    // 2회 실패
    vi.mocked(authPassword.verifyPassword).mockResolvedValue(false);
    for (let i = 0; i < 2; i++) {
      await expect(service.signIn("test@example.com", "wrong", IP)).rejects.toThrow(
        UnauthorizedException,
      );
    }
    // 성공 → reset
    vi.mocked(authPassword.verifyPassword).mockResolvedValue(true);
    const ok = await service.signIn("test@example.com", "password123", IP);
    expect(ok.accessToken).toBeTruthy();

    // reset 후 다시 4회 실패해도 (누적 4 < 5) 여전히 401 (429 아님)
    vi.mocked(authPassword.verifyPassword).mockResolvedValue(false);
    for (let i = 0; i < 4; i++) {
      await expect(service.signIn("test@example.com", "wrong", IP)).rejects.toThrow(
        UnauthorizedException,
      );
    }
  });
});
