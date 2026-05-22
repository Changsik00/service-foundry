import * as simplewebauthn from "@simplewebauthn/browser";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { usePasskeyRegister } from "./passkey.js";

vi.mock("@simplewebauthn/browser", () => ({
  startRegistration: vi.fn(),
}));

const CHALLENGE_TOKEN = "reg-token-abc";

function makeSdk() {
  return {
    fetchPasskeyRegisterOptions:
      vi.fn<() => Promise<{ challengeToken: string; options: object }>>(),
    verifyPasskeyRegister: vi.fn<(challengeToken: string, credential: unknown) => Promise<void>>(),
  };
}

describe("usePasskeyRegister", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("register — options 요청 → startRegistration → verifyPasskeyRegister 호출", async () => {
    const sdk = makeSdk();
    const mockOptions = { rp: { id: "localhost" }, challenge: "ch" };
    sdk.fetchPasskeyRegisterOptions.mockResolvedValue({
      challengeToken: CHALLENGE_TOKEN,
      options: mockOptions,
    });
    const mockCredential = { id: "new-cred-id", response: {} };
    vi.mocked(simplewebauthn.startRegistration).mockResolvedValue(
      mockCredential as ReturnType<typeof simplewebauthn.startRegistration> extends Promise<infer T>
        ? T
        : never,
    );
    sdk.verifyPasskeyRegister.mockResolvedValue(undefined);

    const { result } = renderHook(() => usePasskeyRegister(sdk));

    await act(async () => {
      await result.current.register();
    });

    expect(sdk.fetchPasskeyRegisterOptions).toHaveBeenCalledOnce();
    expect(simplewebauthn.startRegistration).toHaveBeenCalledWith({ optionsJSON: mockOptions });
    expect(sdk.verifyPasskeyRegister).toHaveBeenCalledWith(CHALLENGE_TOKEN, mockCredential);
    expect(result.current.isSuccess).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("register — startRegistration 에러 → error 상태 + isSuccess false", async () => {
    const sdk = makeSdk();
    sdk.fetchPasskeyRegisterOptions.mockResolvedValue({
      challengeToken: CHALLENGE_TOKEN,
      options: {},
    });
    vi.mocked(simplewebauthn.startRegistration).mockRejectedValue(new Error("user cancelled"));

    const { result } = renderHook(() => usePasskeyRegister(sdk));

    await act(async () => {
      await result.current.register().catch(() => {});
    });

    expect(result.current.error).toBe("user cancelled");
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it("register — verifyPasskeyRegister 에러 → error 상태", async () => {
    const sdk = makeSdk();
    sdk.fetchPasskeyRegisterOptions.mockResolvedValue({
      challengeToken: CHALLENGE_TOKEN,
      options: {},
    });
    vi.mocked(simplewebauthn.startRegistration).mockResolvedValue({ id: "cid" } as ReturnType<
      typeof simplewebauthn.startRegistration
    > extends Promise<infer T>
      ? T
      : never);
    sdk.verifyPasskeyRegister.mockRejectedValue(new Error("verify failed"));

    const { result } = renderHook(() => usePasskeyRegister(sdk));

    await act(async () => {
      await result.current.register().catch(() => {});
    });

    expect(result.current.error).toBe("verify failed");
    expect(result.current.isSuccess).toBe(false);
  });

  it("register 실행 중 isLoading === true", async () => {
    const sdk = makeSdk();
    let resolve!: () => void;
    sdk.fetchPasskeyRegisterOptions.mockReturnValue(
      new Promise<{ challengeToken: string; options: object }>((r) => {
        resolve = () => r({ challengeToken: CHALLENGE_TOKEN, options: {} });
      }),
    );

    const { result } = renderHook(() => usePasskeyRegister(sdk));

    act(() => {
      void result.current.register();
    });
    expect(result.current.isLoading).toBe(true);

    vi.mocked(simplewebauthn.startRegistration).mockResolvedValue({ id: "cid" } as ReturnType<
      typeof simplewebauthn.startRegistration
    > extends Promise<infer T>
      ? T
      : never);
    sdk.verifyPasskeyRegister.mockResolvedValue(undefined);

    await act(async () => resolve());
    expect(result.current.isLoading).toBe(false);
  });
});
