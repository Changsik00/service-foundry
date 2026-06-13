import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useChangePassword, useDeleteAccount, useUpdateProfile } from "./mutations";

const mockGet = vi.fn();
const mockPatch = vi.fn();
const mockDelete = vi.fn();
const mockSignOut = vi.fn();

vi.mock("@/lib/http-client", () => ({
  httpClient: {
    get: (...a: unknown[]) => mockGet(...a),
    patch: (...a: unknown[]) => mockPatch(...a),
    delete: (...a: unknown[]) => mockDelete(...a),
  },
}));

vi.mock("@/lib/auth", () => ({
  authSDK: { signOut: (...a: unknown[]) => mockSignOut(...a) },
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return React.createElement(QueryClientProvider, { client: qc }, children);
}

describe("useUpdateProfile", () => {
  beforeEach(() => vi.clearAllMocks());

  it("PATCH /auth/account/profile 호출 + me 캐시 무효화", async () => {
    mockPatch.mockResolvedValue({ status: "ok" });
    const { result } = renderHook(() => useUpdateProfile(), { wrapper });

    result.current.mutate({ displayName: "홍길동" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockPatch).toHaveBeenCalledWith(
      "/auth/account/profile",
      { displayName: "홍길동" },
      expect.objectContaining({ requiresAuth: true }),
    );
  });
});

describe("useChangePassword", () => {
  beforeEach(() => vi.clearAllMocks());

  it("PATCH /auth/account/password 호출", async () => {
    mockPatch.mockResolvedValue({ status: "ok" });
    const { result } = renderHook(() => useChangePassword(), { wrapper });

    result.current.mutate({ currentPassword: "OldPass1!", newPassword: "NewPass2!" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockPatch).toHaveBeenCalledWith(
      "/auth/account/password",
      { currentPassword: "OldPass1!", newPassword: "NewPass2!" },
      expect.objectContaining({ requiresAuth: true }),
    );
  });
});

describe("useDeleteAccount", () => {
  beforeEach(() => vi.clearAllMocks());

  it("CSRF 취득 후 DELETE /auth/account 호출, 성공 시 signOut", async () => {
    mockGet.mockResolvedValue({ csrfToken: "tok-123" });
    mockDelete.mockResolvedValue({ status: "ok" });
    mockSignOut.mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteAccount(), { wrapper });
    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGet).toHaveBeenCalledWith(
      "/auth/csrf",
      expect.objectContaining({ schema: expect.anything() }),
    );
    expect(mockDelete).toHaveBeenCalledWith(
      "/auth/account",
      expect.objectContaining({
        requiresAuth: true,
        headers: { "X-Csrf-Token": "tok-123" },
      }),
    );
    expect(mockSignOut).toHaveBeenCalled();
  });
});
