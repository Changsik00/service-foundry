import { AuthProvider } from "@repo/frontend-auth-react";
import { createMockAuthSDK } from "@repo/frontend-auth-testing";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { UserMenu } from "./user-menu";

const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

const TEST_USER = { id: "u-1", email: "dennis@example.com" };

describe("UserMenu", () => {
  it("로그인 유저 이메일을 표시한다", async () => {
    const sdk = createMockAuthSDK({ currentUser: TEST_USER as never });
    render(
      <AuthProvider sdk={sdk}>
        <UserMenu />
      </AuthProvider>,
    );

    expect(await screen.findByText("dennis@example.com")).toBeInTheDocument();
  });

  it("로그아웃 클릭 → signOut 호출 + /login 이동", async () => {
    const sdk = createMockAuthSDK({ currentUser: TEST_USER as never });
    const signOutSpy = vi.spyOn(sdk, "signOut");
    render(
      <AuthProvider sdk={sdk}>
        <UserMenu />
      </AuthProvider>,
    );

    fireEvent.click(await screen.findByRole("button", { name: "로그아웃" }));

    await waitFor(() => {
      expect(signOutSpy).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith("/login");
    });
  });
});
