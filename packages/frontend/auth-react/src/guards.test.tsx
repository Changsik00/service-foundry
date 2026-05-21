import type { AuthSDK, Session, User } from "@repo/auth-contracts";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RequireAuth, RequireRole } from "./guards.js";
import { AuthProvider } from "./provider.js";

const mockUser: User = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "guard@example.com",
  role: "user",
  createdAt: new Date().toISOString(),
};

const mockSession: Session = {
  userId: mockUser.id,
  expiresAt: new Date(Date.now() + 3600_000).toISOString(),
};

function makeSdk(user: User | null = mockUser): AuthSDK {
  return {
    signIn: vi.fn().mockResolvedValue({ success: true, user: mockUser, session: mockSession }),
    signOut: vi.fn().mockResolvedValue(undefined),
    getCurrentUser: vi.fn().mockResolvedValue(user),
    signUp: vi.fn().mockResolvedValue({ success: true, user: mockUser, session: mockSession }),
    refresh: vi.fn().mockResolvedValue(null),
  };
}

describe("RequireAuth", () => {
  it("isLoading → fallback 렌더", () => {
    const sdk = makeSdk();
    sdk.getCurrentUser = vi.fn().mockReturnValue(new Promise(() => {}));
    render(
      <AuthProvider sdk={sdk}>
        <RequireAuth fallback={<span>fallback</span>}>
          <span>protected</span>
        </RequireAuth>
      </AuthProvider>,
    );
    expect(screen.getByText("fallback")).toBeInTheDocument();
    expect(screen.queryByText("protected")).not.toBeInTheDocument();
  });

  it("미인증 → fallback 렌더", async () => {
    const sdk = makeSdk(null);
    render(
      <AuthProvider sdk={sdk}>
        <RequireAuth fallback={<span>not-auth</span>}>
          <span>protected</span>
        </RequireAuth>
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByText("not-auth")).toBeInTheDocument());
    expect(screen.queryByText("protected")).not.toBeInTheDocument();
  });

  it("인증 → children 렌더", async () => {
    const sdk = makeSdk();
    render(
      <AuthProvider sdk={sdk}>
        <RequireAuth>
          <span>protected</span>
        </RequireAuth>
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByText("protected")).toBeInTheDocument());
  });
});

describe("RequireRole", () => {
  it("role 불일치 → fallback 렌더", async () => {
    const sdk = makeSdk(); // user.role = "user"
    render(
      <AuthProvider sdk={sdk}>
        {/* biome-ignore lint/a11y/useValidAriaRole: RequireRole.role 는 커스텀 prop (ARIA role 아님) */}
        <RequireRole role="admin" fallback={<span>no-access</span>}>
          <span>admin-content</span>
        </RequireRole>
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByText("no-access")).toBeInTheDocument());
    expect(screen.queryByText("admin-content")).not.toBeInTheDocument();
  });

  it("role 일치 → children 렌더", async () => {
    const adminUser: User = { ...mockUser, role: "admin" };
    const sdk = makeSdk(adminUser);
    render(
      <AuthProvider sdk={sdk}>
        {/* biome-ignore lint/a11y/useValidAriaRole: RequireRole.role 는 커스텀 prop (ARIA role 아님) */}
        <RequireRole role="admin">
          <span>admin-content</span>
        </RequireRole>
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByText("admin-content")).toBeInTheDocument());
  });
});
