import type { AuthResult, MfaChallenge } from "@repo/auth-contracts";
import * as simplewebauthn from "@simplewebauthn/browser";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useMfaChallenge } from "./mfa.js";

vi.mock("@simplewebauthn/browser", () => ({
  startAuthentication: vi.fn(),
}));

const CHALLENGE_TOKEN = "token-abc";
const CRED_ID = "cred-id-123";

const mfaChallengeTotp: MfaChallenge = {
  challengeId: CHALLENGE_TOKEN,
  method: "totp",
  expiresAt: new Date(Date.now() + 300_000).toISOString(),
};

const mfaChallengePasskey: MfaChallenge = {
  challengeId: CHALLENGE_TOKEN,
  method: "passkey",
  expiresAt: new Date(Date.now() + 300_000).toISOString(),
};

const successResult: AuthResult = {
  success: true,
  user: {
    id: "00000000-0000-0000-0000-000000000001",
    email: "a@b.com",
    role: "user",
    createdAt: new Date().toISOString(),
  },
  session: {
    userId: "00000000-0000-0000-0000-000000000001",
    expiresAt: new Date(Date.now() + 3600_000).toISOString(),
  },
};

function makeSdk() {
  return {
    verifyMfaTotp: vi.fn<(token: string, code: string) => Promise<AuthResult>>(),
    fetchPasskeyAuthOptions: vi.fn<() => Promise<{ challengeToken: string; options: object }>>(),
    verifyPasskeyAuth:
      vi.fn<
        (challengeToken: string, credentialId: string, credential: unknown) => Promise<AuthResult>
      >(),
  };
}

describe("useMfaChallenge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("TOTP 경로", () => {
    it("submitTotp — sdk.verifyMfaTotp 호출 후 AuthResult 반환", async () => {
      const sdk = makeSdk();
      sdk.verifyMfaTotp.mockResolvedValue(successResult);

      const { result } = renderHook(() => useMfaChallenge(mfaChallengeTotp, sdk));

      let authResult: AuthResult | undefined;
      await act(async () => {
        authResult = await result.current.submitTotp("123456");
      });

      expect(sdk.verifyMfaTotp).toHaveBeenCalledWith(CHALLENGE_TOKEN, "123456");
      expect(authResult).toEqual(successResult);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("submitTotp — sdk 에러 → error 상태 설정", async () => {
      const sdk = makeSdk();
      sdk.verifyMfaTotp.mockRejectedValue(new Error("invalid code"));

      const { result } = renderHook(() => useMfaChallenge(mfaChallengeTotp, sdk));

      await act(async () => {
        await result.current.submitTotp("000000").catch(() => {});
      });

      expect(result.current.error).toBe("invalid code");
      expect(result.current.isLoading).toBe(false);
    });

    it("submitTotp 실행 중 isLoading === true", async () => {
      const sdk = makeSdk();
      let resolve!: (v: AuthResult) => void;
      sdk.verifyMfaTotp.mockReturnValue(new Promise<AuthResult>((r) => (resolve = r)));

      const { result } = renderHook(() => useMfaChallenge(mfaChallengeTotp, sdk));

      act(() => {
        void result.current.submitTotp("123456");
      });
      expect(result.current.isLoading).toBe(true);
      await act(async () => resolve(successResult));
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("Passkey 경로", () => {
    it("authenticatePasskey — options 요청 → startAuthentication → verifyPasskeyAuth 호출", async () => {
      const sdk = makeSdk();
      const mockOptions = { rpId: "localhost", challenge: "ch", allowCredentials: [] };
      sdk.fetchPasskeyAuthOptions.mockResolvedValue({
        challengeToken: CHALLENGE_TOKEN,
        options: mockOptions,
      });
      const mockCredential = { id: CRED_ID, response: {} };
      vi.mocked(simplewebauthn.startAuthentication).mockResolvedValue(
        mockCredential as ReturnType<typeof simplewebauthn.startAuthentication> extends Promise<
          infer T
        >
          ? T
          : never,
      );
      sdk.verifyPasskeyAuth.mockResolvedValue(successResult);

      const { result } = renderHook(() => useMfaChallenge(mfaChallengePasskey, sdk));

      let authResult: AuthResult | undefined;
      await act(async () => {
        authResult = await result.current.authenticatePasskey();
      });

      expect(sdk.fetchPasskeyAuthOptions).toHaveBeenCalledOnce();
      expect(simplewebauthn.startAuthentication).toHaveBeenCalledWith({ optionsJSON: mockOptions });
      expect(sdk.verifyPasskeyAuth).toHaveBeenCalledWith(CHALLENGE_TOKEN, CRED_ID, mockCredential);
      expect(authResult).toEqual(successResult);
    });

    it("authenticatePasskey — startAuthentication 에러 → error 상태 설정", async () => {
      const sdk = makeSdk();
      sdk.fetchPasskeyAuthOptions.mockResolvedValue({
        challengeToken: CHALLENGE_TOKEN,
        options: {},
      });
      vi.mocked(simplewebauthn.startAuthentication).mockRejectedValue(new Error("user cancelled"));

      const { result } = renderHook(() => useMfaChallenge(mfaChallengePasskey, sdk));

      await act(async () => {
        await result.current.authenticatePasskey().catch(() => {});
      });

      expect(result.current.error).toBe("user cancelled");
    });
  });
});
