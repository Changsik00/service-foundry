import { ConflictException } from "@nestjs/common";
import { createInMemoryKeyStore } from "@repo/backend-auth-jwt";
import * as authPassword from "@repo/backend-auth-password";
import * as authSession from "@repo/backend-auth-session";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { JwtService } from "../jwt/jwt.service.js";
import type { IProvisionService } from "../provision/provision.service.js";
import type { UserStore } from "./password-reset.stores.js";
import type { SessionStore } from "./session.stores.js";
import { SignupService } from "./signup.service.js";

vi.mock("@repo/backend-auth-password", async (importOriginal) => {
  const mod = await importOriginal<typeof authPassword>();
  return { ...mod, hashPassword: vi.fn() };
});

vi.mock("@repo/backend-auth-session", async (importOriginal) => {
  const mod = await importOriginal<typeof authSession>();
  return { ...mod, createSession: vi.fn() };
});

const mockUserRow = {
  id: "00000000-0000-0000-0000-000000000002",
  email: "new@example.com",
  passwordHash: "$argon2id$hashed",
  role: "user" as const,
  emailVerified: false,
  createdAt: new Date(),
};

const mockSessionResult = {
  session: {
    id: "sess-0002",
    userId: mockUserRow.id,
    refreshTokenHash: "hash456",
    refreshTokenFamily: "fam-0002",
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 24 * 3600_000),
    revokedAt: null,
    orgId: null,
  },
  refreshToken: "raw-refresh-token-signup",
};

function makeUserStore(existingUser: typeof mockUserRow | null = null): UserStore {
  return {
    findByEmail: vi.fn().mockResolvedValue(existingUser),
    findById: vi.fn().mockResolvedValue(mockUserRow),
    updatePasswordHash: vi.fn(),
    updateEmailVerified: vi.fn(),
    insert: vi.fn().mockResolvedValue(mockUserRow),
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

function makeProvisionService(): IProvisionService {
  return { provisionUser: vi.fn().mockResolvedValue(undefined) };
}

describe("SignupService", () => {
  let jwtService: JwtService;

  beforeEach(async () => {
    vi.mocked(authSession.createSession).mockResolvedValue(mockSessionResult);
    vi.mocked(authPassword.hashPassword).mockResolvedValue("$argon2id$hashed");
    const keyStore = await createInMemoryKeyStore({ kid: "test-key" });
    jwtService = { getKeyStore: () => keyStore } as unknown as JwtService;
  });

  const jwtOpts = { issuer: "http://localhost:3000", audience: "http://localhost:3000" };

  it("성공 — 신규 이메일 → accessToken + user + refreshToken 반환", async () => {
    const service = new SignupService(
      makeUserStore(),
      makeSessionStore(),
      jwtService,
      jwtOpts,
      makeProvisionService(),
    );

    const result = await service.signUp("new@example.com", "password123");

    expect(result.accessToken).toBeTruthy();
    expect(result.user.email).toBe("new@example.com");
    expect(result.refreshToken).toBe("raw-refresh-token-signup");
  });

  it("이메일 중복 → ConflictException", async () => {
    const service = new SignupService(
      makeUserStore(mockUserRow),
      makeSessionStore(),
      jwtService,
      jwtOpts,
      makeProvisionService(),
    );

    await expect(service.signUp("new@example.com", "password123")).rejects.toThrow(
      ConflictException,
    );
  });

  it("password 해싱 후 insert 호출됨", async () => {
    const userStore = makeUserStore();
    const service = new SignupService(
      userStore,
      makeSessionStore(),
      jwtService,
      jwtOpts,
      makeProvisionService(),
    );

    await service.signUp("new@example.com", "password123");

    expect(authPassword.hashPassword).toHaveBeenCalledWith("password123");
    expect(userStore.insert).toHaveBeenCalledWith(
      expect.objectContaining({ email: "new@example.com", passwordHash: "$argon2id$hashed" }),
    );
  });

  it("회원가입 성공 시 provisionUser 호출됨", async () => {
    const provisionService = makeProvisionService();
    const service = new SignupService(
      makeUserStore(),
      makeSessionStore(),
      jwtService,
      jwtOpts,
      provisionService,
    );

    await service.signUp("new@example.com", "password123");

    expect(provisionService.provisionUser).toHaveBeenCalledWith(mockUserRow.id, "new@example.com");
  });
});
