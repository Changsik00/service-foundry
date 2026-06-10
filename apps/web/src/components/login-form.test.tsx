import { AuthProvider } from "@repo/frontend-auth-react";
import { createMockAuthSDK } from "@repo/frontend-auth-testing";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LoginForm } from "./login-form";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

function renderWithAuth(signInResult?: { success: boolean; reason?: string }) {
  const sdk = createMockAuthSDK(signInResult ? { signInResult: signInResult as never } : undefined);
  return render(
    <AuthProvider sdk={sdk}>
      <LoginForm />
    </AuthProvider>,
  );
}

describe("LoginForm", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("이메일 + 비밀번호 입력 필드와 로그인 버튼을 렌더한다", () => {
    renderWithAuth();

    expect(screen.getByPlaceholderText("이메일")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("비밀번호")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "로그인" })).toBeInTheDocument();
  });

  it("제출 시 signIn({ email, password })를 호출한다", async () => {
    const sdk = createMockAuthSDK();
    const signInSpy = vi.spyOn(sdk, "signIn");

    render(
      <AuthProvider sdk={sdk}>
        <LoginForm />
      </AuthProvider>,
    );

    fireEvent.change(screen.getByPlaceholderText("이메일"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("비밀번호"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "로그인" }));

    await waitFor(() => {
      expect(signInSpy).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });
  });

  it("signIn 실패 시 에러 메시지를 표시한다", async () => {
    renderWithAuth({ success: false, reason: "invalid_credentials" });

    fireEvent.change(screen.getByPlaceholderText("이메일"), {
      target: { value: "wrong@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("비밀번호"), {
      target: { value: "wrongpw" },
    });
    fireEvent.click(screen.getByRole("button", { name: "로그인" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "이메일 또는 비밀번호가 올바르지 않습니다.",
      );
    });
  });

  it("signIn 성공 시 router.push('/')를 호출한다", async () => {
    renderWithAuth({ success: true });

    fireEvent.change(screen.getByPlaceholderText("이메일"), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("비밀번호"), {
      target: { value: "correctpw" },
    });
    fireEvent.click(screen.getByRole("button", { name: "로그인" }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });
});
