import { AuthProvider } from "@repo/frontend-auth-react";
import { createMockAuthSDK } from "@repo/frontend-auth-testing";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { InviteAccept } from "./InviteAccept";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockPost = vi.fn();
vi.mock("@/lib/http-client", () => ({
  httpClient: { get: vi.fn(), post: (...a: unknown[]) => mockPost(...a) },
}));

const TOKEN = "t".repeat(32);
const TEST_USER = { id: "u-1", email: "invitee@example.com" };

function renderAccept(loggedIn: boolean) {
  const sdk = createMockAuthSDK(loggedIn ? { currentUser: TEST_USER as never } : undefined);
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <AuthProvider sdk={sdk}>
        <InviteAccept token={TOKEN} />
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe("InviteAccept", () => {
  beforeEach(() => vi.clearAllMocks());

  it("비로그인 → 로그인/회원가입 분기 (redirect 보존)", async () => {
    renderAccept(false);

    const signup = await screen.findByRole("link", { name: "계정 만들고 수락" });
    expect(signup).toHaveAttribute(
      "href",
      `/signup?redirect=${encodeURIComponent(`/invite/${TOKEN}`)}`,
    );
    expect(screen.getByRole("link", { name: "로그인하고 수락" })).toBeInTheDocument();
  });

  it("로그인 → 수락 클릭 → accept API + 콘솔 이동", async () => {
    mockPost.mockResolvedValue({ orgId: "org-9" });
    renderAccept(true);

    fireEvent.click(await screen.findByRole("button", { name: "초대 수락" }));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith(
        "/auth/org/invite/accept",
        { token: TOKEN },
        expect.objectContaining({ requiresAuth: true }),
      );
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  it("만료 (410) → 사실+행동 에러", async () => {
    mockPost.mockRejectedValue(Object.assign(new Error("gone"), { statusCode: 410 }));
    renderAccept(true);

    fireEvent.click(await screen.findByRole("button", { name: "초대 수락" }));

    expect(
      await screen.findByText(
        "초대가 만료되었거나 유효하지 않습니다. 초대한 분께 다시 요청해주세요",
      ),
    ).toBeInTheDocument();
  });
});
