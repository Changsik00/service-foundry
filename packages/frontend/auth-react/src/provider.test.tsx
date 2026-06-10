import type { AuthSDK, Session, User } from "@repo/auth-contracts";
import { act, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useAuth, useSession } from "./hooks.js";
import { AuthProvider } from "./provider.js";

const mockUser: User = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "test@example.com",
  role: "user",
  createdAt: new Date().toISOString(),
};

const mockSession: Session = {
  userId: mockUser.id,
  expiresAt: new Date(Date.now() + 3600_000).toISOString(),
};

function makeSdk(overrides: Partial<AuthSDK> = {}): AuthSDK {
  return {
    signIn: vi.fn().mockResolvedValue({ success: true, user: mockUser, session: mockSession }),
    signOut: vi.fn().mockResolvedValue(undefined),
    getCurrentUser: vi.fn().mockResolvedValue(mockUser),
    signUp: vi.fn().mockResolvedValue({ success: true, user: mockUser, session: mockSession }),
    refresh: vi.fn().mockResolvedValue(null),
    verifyMfaTotp: vi.fn(),
    fetchPasskeyRegisterOptions: vi.fn(),
    verifyPasskeyRegister: vi.fn(),
    fetchPasskeyAuthOptions: vi.fn(),
    verifyPasskeyAuth: vi.fn(),
    ...overrides,
  };
}

function ShowUser() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <span>loading</span>;
  return <span>{user ? `user:${user.email}` : "no-user"}</span>;
}

describe("AuthProvider + useAuth + useSession", () => {
  it("mount 시 getCurrentUser() 호출 → isLoading false, user 설정", async () => {
    const sdk = makeSdk();
    render(
      <AuthProvider sdk={sdk}>
        <ShowUser />
      </AuthProvider>,
    );
    expect(screen.getByText("loading")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(`user:${mockUser.email}`)).toBeInTheDocument());
    expect(sdk.getCurrentUser).toHaveBeenCalledTimes(1);
  });

  it("getCurrentUser() null → 미인증 상태", async () => {
    const sdk = makeSdk({ getCurrentUser: vi.fn().mockResolvedValue(null) });
    render(
      <AuthProvider sdk={sdk}>
        <ShowUser />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByText("no-user")).toBeInTheDocument());
  });

  it("useAuth() — <AuthProvider> 외부 호출 시 Error", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<ShowUser />)).toThrow("useAuth must be used within <AuthProvider>");
    consoleError.mockRestore();
  });

  it("signIn() → sdk.signIn() 위임 + success 시 user 업데이트", async () => {
    const sdk = makeSdk({ getCurrentUser: vi.fn().mockResolvedValue(null) });
    let capturedSignIn: ((input: { email: string; password: string }) => Promise<unknown>) | null =
      null;
    function CaptureSignIn() {
      const { user, signIn } = useAuth();
      capturedSignIn = signIn;
      return <span>{user ? `user:${user.email}` : "no-user"}</span>;
    }
    render(
      <AuthProvider sdk={sdk}>
        <CaptureSignIn />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByText("no-user")).toBeInTheDocument());
    await act(async () => {
      await capturedSignIn?.({ email: "test@example.com", password: "password1" });
    });
    expect(screen.getByText(`user:${mockUser.email}`)).toBeInTheDocument();
    expect(sdk.signIn).toHaveBeenCalledWith({ email: "test@example.com", password: "password1" });
  });

  it("signOut() → sdk.signOut() 위임 + user null", async () => {
    const sdk = makeSdk();
    let capturedSignOut: (() => Promise<void>) | null = null;
    function CaptureSignOut() {
      const { user, signOut } = useAuth();
      capturedSignOut = signOut;
      return <span>{user ? `user:${user.email}` : "no-user"}</span>;
    }
    render(
      <AuthProvider sdk={sdk}>
        <CaptureSignOut />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByText(`user:${mockUser.email}`)).toBeInTheDocument());
    await act(async () => {
      await capturedSignOut?.();
    });
    expect(screen.getByText("no-user")).toBeInTheDocument();
    expect(sdk.signOut).toHaveBeenCalledTimes(1);
  });

  it("useSession() — user / isLoading 반환 (read-only)", async () => {
    const sdk = makeSdk();
    function SessionDisplay() {
      const { user, isLoading } = useSession();
      if (isLoading) return <span>loading</span>;
      return <span>{user ? `session:${user.email}` : "no-session"}</span>;
    }
    render(
      <AuthProvider sdk={sdk}>
        <SessionDisplay />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByText(`session:${mockUser.email}`)).toBeInTheDocument());
  });

  it("getCurrentUser() 401 → refresh → 재조회 → user 설정", async () => {
    const err401 = Object.assign(new Error("Unauthorized"), { statusCode: 401 });
    const sdk = makeSdk({
      getCurrentUser: vi.fn().mockRejectedValueOnce(err401).mockResolvedValueOnce(mockUser),
      refresh: vi.fn().mockResolvedValue(null),
    });
    render(
      <AuthProvider sdk={sdk}>
        <ShowUser />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByText(`user:${mockUser.email}`)).toBeInTheDocument());
    expect(sdk.refresh).toHaveBeenCalledTimes(1);
    expect(sdk.getCurrentUser).toHaveBeenCalledTimes(2);
  });
});

describe("withAuthRetry", () => {
  function CaptureRetry({
    onCapture,
  }: {
    onCapture: (fn: <T>(f: () => Promise<T>) => Promise<T>) => void;
  }) {
    const { withAuthRetry } = useAuth();
    onCapture(withAuthRetry);
    return null;
  }

  it("fn 성공 → 그대로 반환, refresh 미호출", async () => {
    const sdk = makeSdk();
    let captured: (<T>(f: () => Promise<T>) => Promise<T>) | null = null;
    render(
      <AuthProvider sdk={sdk}>
        <CaptureRetry
          onCapture={(fn) => {
            captured = fn;
          }}
        />
      </AuthProvider>,
    );
    await waitFor(() => expect(captured).not.toBeNull());
    const result = await act(async () => captured?.(() => Promise.resolve("ok")));
    expect(result).toBe("ok");
    expect(sdk.refresh).not.toHaveBeenCalled();
  });

  it("fn 401 → refresh 성공 → fn 재시도 반환", async () => {
    const sdk = makeSdk();
    let captured: (<T>(f: () => Promise<T>) => Promise<T>) | null = null;
    render(
      <AuthProvider sdk={sdk}>
        <CaptureRetry
          onCapture={(fn) => {
            captured = fn;
          }}
        />
      </AuthProvider>,
    );
    await waitFor(() => expect(captured).not.toBeNull());
    const err401 = Object.assign(new Error("Unauthorized"), { statusCode: 401 });
    const fn = vi.fn().mockRejectedValueOnce(err401).mockResolvedValueOnce("retried");
    const result = await act(async () => captured?.(fn));
    expect(result).toBe("retried");
    expect(sdk.refresh).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("fn 401 → refresh 실패 → user=null + onUnauthenticated 호출 + throw", async () => {
    const onUnauthenticated = vi.fn();
    const refreshErr = new Error("refresh failed");
    const sdk = makeSdk({ refresh: vi.fn().mockRejectedValue(refreshErr) });
    let captured: (<T>(f: () => Promise<T>) => Promise<T>) | null = null;
    function ShowAndCapture() {
      const { user, withAuthRetry } = useAuth();
      captured = withAuthRetry;
      return <span>{user ? `user:${user.email}` : "no-user"}</span>;
    }
    render(
      <AuthProvider sdk={sdk} onUnauthenticated={onUnauthenticated}>
        <ShowAndCapture />
      </AuthProvider>,
    );
    await waitFor(() => expect(captured).not.toBeNull());
    const err401 = Object.assign(new Error("Unauthorized"), { statusCode: 401 });
    // act 내부에서 catch — act가 reject하면 state flush가 보장되지 않으므로 에러를 내부에서 잡음
    let caughtError: unknown = null;
    await act(async () => {
      try {
        await captured?.(() => Promise.reject(err401));
      } catch (e) {
        caughtError = e;
      }
    });
    expect(caughtError).toBeTruthy();
    expect(onUnauthenticated).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.getByText("no-user")).toBeInTheDocument());
  });
});
