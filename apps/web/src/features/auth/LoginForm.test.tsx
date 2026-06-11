import { AuthProvider } from "@repo/frontend-auth-react";
import { createMockAuthSDK } from "@repo/frontend-auth-testing";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LoginForm } from "./LoginForm";

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

  it("라벨이 항상 표시된 이메일/비밀번호 필드와 로그인 버튼을 렌더한다 (DESIGN §5.2 — placeholder 는 라벨 대체가 아님)", () => {
    renderWithAuth();

    expect(screen.getByLabelText("이메일")).toBeInTheDocument();
    expect(screen.getByLabelText("비밀번호")).toBeInTheDocument();
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

    fireEvent.change(screen.getByLabelText("이메일"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText("비밀번호"), {
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

  it("로그인 성공 → /(콘솔)로 push 한다", async () => {
    renderWithAuth({ success: true });

    fireEvent.change(screen.getByLabelText("이메일"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText("비밀번호"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "로그인" }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/"));
  });

  it("로그인 실패 → 비밀번호 필드 아래 enumeration-safe 인라인 에러 (DESIGN §6.1)", async () => {
    renderWithAuth({ success: false, reason: "invalid_credentials" });

    fireEvent.change(screen.getByLabelText("이메일"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText("비밀번호"), {
      target: { value: "wrong-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "로그인" }));

    expect(await screen.findByText("이메일 또는 비밀번호가 올바르지 않습니다")).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("잘못된 이메일 형식 → Zod 인라인 에러 (형식 예시 포함)", async () => {
    renderWithAuth();

    fireEvent.change(screen.getByLabelText("이메일"), {
      target: { value: "not-an-email" },
    });
    fireEvent.change(screen.getByLabelText("비밀번호"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "로그인" }));

    expect(
      await screen.findByText("올바른 이메일 형식을 입력해주세요 (예: user@example.com)"),
    ).toBeInTheDocument();
  });
});
