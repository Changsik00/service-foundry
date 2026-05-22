import { UnauthorizedException } from "@nestjs/common";
import { createInMemoryKeyStore } from "@repo/backend-auth-jwt";
import * as authPasskey from "@repo/backend-auth-passkey";
import * as authSession from "@repo/backend-auth-session";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { JwtService } from "../jwt/jwt.service.js";
import { PasskeyService } from "./passkey.service.js";
import type { PasskeyStore } from "./passkey.stores.js";
import type { UserStore } from "./password-reset.stores.js";
import type { SessionStore } from "./session.stores.js";

vi.mock("@repo/backend-auth-passkey", async (importOriginal) => {
  const mod = await importOriginal<typeof authPasskey>();
  return {
    ...mod,
    generateRegistrationOpts: vi.fn(),
    verifyRegistration: vi.fn(),
    generateAuthenticationOpts: vi.fn(),
    verifyAuthentication: vi.fn(),
  };
});

vi.mock("@repo/backend-auth-session", async (importOriginal) => {
  const mod = await importOriginal<typeof authSession>();
  return { ...mod, createSession: vi.fn() };
});

const CHALLENGE_ID = "00000000-0000-0000-0000-000000000099";
const CHALLENGE_VAL = "base64url-challenge-value";
const CRED_ID = "cred-abc-123";
const USER_ID = "00000000-0000-0000-0000-000000000001";

function makeStore(): PasskeyStore {
  return {
    findCredentialsByUserId: vi.fn().mockResolvedValue([]),
    findCredentialById: vi.fn().mockResolvedValue(undefined),
    insertCredential: vi.fn().mockResolvedValue(undefined),
    updateCounter: vi.fn().mockResolvedValue(undefined),
    insertChallenge: vi.fn().mockResolvedValue(undefined),
    findChallenge: vi.fn().mockResolvedValue({
      id: CHALLENGE_ID,
      challenge: CHALLENGE_VAL,
      userId: USER_ID,
      expiresAt: new Date(Date.now() + 300_000),
    }),
    deleteChallenge: vi.fn().mockResolvedValue(undefined),
  };
}

function makeSessionStore(): SessionStore {
  return {
    insert: vi.fn().mockResolvedValue({
      id: "sess-1",
      refreshTokenHash: "h",
      refreshTokenFamily: "f",
      userId: USER_ID,
      createdAt: new Date(),
      expiresAt: new Date(),
      revokedAt: null,
    }),
    findByHash: vi.fn(),
    updateRevoked: vi.fn(),
    bulkRevokeByFamily: vi.fn(),
  };
}

function makeUserStore(): UserStore {
  return {
    findByEmail: vi.fn(),
    findById: vi.fn().mockResolvedValue({
      id: USER_ID,
      role: "user",
      email: "a@b.com",
      passwordHash: "",
      emailVerified: true,
      createdAt: new Date(),
    }),
    insert: vi.fn(),
    updatePasswordHash: vi.fn(),
    updateEmailVerified: vi.fn(),
  };
}

async function makeJwtService(): Promise<JwtService> {
  const keyStore = await createInMemoryKeyStore({ kid: "test-key" });
  return { getKeyStore: () => keyStore } as unknown as JwtService;
}

const jwtOpts = { issuer: "http://localhost:3000", audience: "http://localhost:3000" };

describe("PasskeyService", () => {
  let service: PasskeyService;
  let store: PasskeyStore;
  let sessionStore: SessionStore;
  let userStore: UserStore;

  beforeEach(async () => {
    vi.clearAllMocks();
    store = makeStore();
    sessionStore = makeSessionStore();
    userStore = makeUserStore();
    service = new PasskeyService(store, sessionStore, userStore, await makeJwtService(), jwtOpts);
  });

  describe("generateRegisterOptions", () => {
    it("챌린지를 저장하고 challengeToken + options을 반환한다", async () => {
      vi.mocked(authPasskey.generateRegistrationOpts).mockResolvedValue({
        challenge: CHALLENGE_VAL,
        rp: { id: "localhost", name: "Test" },
        user: { id: "uid", name: "a@b.com", displayName: "" },
        pubKeyCredParams: [],
        timeout: 60000,
        attestation: "none",
        excludeCredentials: [],
        authenticatorSelection: {},
        extensions: {},
      } as unknown as Awaited<ReturnType<typeof authPasskey.generateRegistrationOpts>>);

      const result = await service.generateRegisterOptions(USER_ID, "a@b.com");

      expect(store.insertChallenge).toHaveBeenCalledOnce();
      expect(result).toHaveProperty("challengeToken");
      expect(result).toHaveProperty("options");
    });
  });

  describe("verifyRegister", () => {
    it("검증 성공 시 credential을 저장하고 챌린지를 삭제한다", async () => {
      vi.mocked(authPasskey.verifyRegistration).mockResolvedValue({
        verified: true,
        registrationInfo: {
          credential: {
            id: CRED_ID,
            publicKey: Buffer.from("pubkey"),
            counter: 0,
            transports: ["internal"],
          },
          credentialDeviceType: "singleDevice",
          credentialBackedUp: false,
        },
      } as unknown as Awaited<ReturnType<typeof authPasskey.verifyRegistration>>);

      await service.verifyRegister(USER_ID, CHALLENGE_ID, {} as never);

      expect(store.insertCredential).toHaveBeenCalledOnce();
      expect(store.deleteChallenge).toHaveBeenCalledWith(CHALLENGE_ID);
    });

    it("만료/미존재 챌린지 → 401", async () => {
      vi.mocked(store.findChallenge as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
      await expect(service.verifyRegister(USER_ID, CHALLENGE_ID, {} as never)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("simplewebauthn 검증 실패 → 401", async () => {
      vi.mocked(authPasskey.verifyRegistration).mockResolvedValue({
        verified: false,
      } as Awaited<ReturnType<typeof authPasskey.verifyRegistration>>);

      await expect(service.verifyRegister(USER_ID, CHALLENGE_ID, {} as never)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe("generateAuthOptions", () => {
    it("챌린지를 저장하고 challengeToken + options을 반환한다", async () => {
      vi.mocked(authPasskey.generateAuthenticationOpts).mockResolvedValue({
        challenge: CHALLENGE_VAL,
        rpId: "localhost",
        allowCredentials: [],
        userVerification: "preferred",
        timeout: 60000,
      } as unknown as Awaited<ReturnType<typeof authPasskey.generateAuthenticationOpts>>);

      const result = await service.generateAuthOptions();

      expect(store.insertChallenge).toHaveBeenCalledOnce();
      expect(result).toHaveProperty("challengeToken");
      expect(result).toHaveProperty("options");
    });
  });

  describe("verifyAuth", () => {
    it("검증 성공 시 counter 업데이트 + 세션 발급", async () => {
      vi.mocked(store.findCredentialById as ReturnType<typeof vi.fn>).mockResolvedValue({
        credentialId: CRED_ID,
        publicKey: Buffer.from("pubkey").toString("base64url"),
        counter: 0,
        transports: ["internal"],
        userId: USER_ID,
        id: "row-id",
        deviceType: "singleDevice",
        backedUp: false,
        createdAt: new Date(),
      });
      vi.mocked(authPasskey.verifyAuthentication).mockResolvedValue({
        verified: true,
        authenticationInfo: { credentialID: CRED_ID, newCounter: 1 },
      } as unknown as Awaited<ReturnType<typeof authPasskey.verifyAuthentication>>);
      vi.mocked(authSession.createSession as ReturnType<typeof vi.fn>).mockResolvedValue({
        refreshToken: "rt-xyz",
      });

      const result = await service.verifyAuth(CHALLENGE_ID, CRED_ID, {} as never);

      expect(store.updateCounter).toHaveBeenCalledWith(CRED_ID, 1);
      expect(result).toHaveProperty("accessToken");
      expect(result).toHaveProperty("refreshToken");
    });

    it("만료/미존재 챌린지 → 401", async () => {
      vi.mocked(store.findChallenge as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
      await expect(service.verifyAuth(CHALLENGE_ID, CRED_ID, {} as never)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("credential 미존재 → 401", async () => {
      vi.mocked(store.findCredentialById as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
      await expect(service.verifyAuth(CHALLENGE_ID, CRED_ID, {} as never)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
