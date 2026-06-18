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

  describe("선제 갱신 (proactive refresh)", () => {
    it("만료 margin 전 자동 refresh 호출", async () => {
      vi.useFakeTimers({ now: 1_000_000 });
      try {
        const refresh = vi.fn().mockResolvedValue(null);
        // margin 60s + 5s → delay 5s
        const sdk = makeSdk({
          getAccessTokenExpiresAt: vi.fn().mockReturnValue(1_000_000 + 60_000 + 5_000),
          refresh,
        });
        render(
          <AuthProvider sdk={sdk}>
            <ShowUser />
          </AuthProvider>,
        );
        await act(async () => {
          await vi.advanceTimersByTimeAsync(0); // mount getCurrentUser → user → schedule
        });
        expect(refresh).not.toHaveBeenCalled();
        await act(async () => {
          await vi.advanceTimersByTimeAsync(5_000);
        });
        expect(refresh).toHaveBeenCalledTimes(1);
      } finally {
        vi.useRealTimers();
      }
    });

    it("refresh 후 새 만료로 재스케줄", async () => {
      vi.useFakeTimers({ now: 1_000_000 });
      try {
        let exp = 1_000_000 + 65_000; // delay 5s
        const refresh = vi.fn().mockImplementation(async () => {
          exp = Date.now() + 65_000; // 갱신 후 새 만료
        });
        const sdk = makeSdk({ getAccessTokenExpiresAt: vi.fn(() => exp), refresh });
        render(
          <AuthProvider sdk={sdk}>
            <ShowUser />
          </AuthProvider>,
        );
        await act(async () => {
          await vi.advanceTimersByTimeAsync(0);
        });
        await act(async () => {
          await vi.advanceTimersByTimeAsync(5_000);
        });
        await act(async () => {
          await vi.advanceTimersByTimeAsync(5_000);
        });
        expect(refresh).toHaveBeenCalledTimes(2);
      } finally {
        vi.useRealTimers();
      }
    });

    it("getAccessTokenExpiresAt 미제공(provider 모드) → 타이머 비활성", async () => {
      vi.useFakeTimers({ now: 1_000_000 });
      try {
        const refresh = vi.fn().mockResolvedValue(null);
        const sdk = makeSdk({ refresh }); // getAccessTokenExpiresAt 없음
        render(
          <AuthProvider sdk={sdk}>
            <ShowUser />
          </AuthProvider>,
        );
        await act(async () => {
          await vi.advanceTimersByTimeAsync(60 * 60_000);
        });
        expect(refresh).not.toHaveBeenCalled();
      } finally {
        vi.useRealTimers();
      }
    });
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
});
