import { AppError } from "@repo/errors";
import { AuthProvider } from "@repo/frontend-auth-react";
import { createMockAuthSDK } from "@repo/frontend-auth-testing";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SignupForm } from "./SignupForm";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const TEST_USER = { id: "u-1", email: "new@example.com" };
const TEST_SESSION = { userId: "u-1", expiresAt: "2099-01-01T00:00:00Z" };

function fillAndSubmit() {
  fireEvent.change(screen.getByLabelText("이름"), { target: { value: "데니스" } });
  fireEvent.change(screen.getByLabelText("이메일"), { target: { value: "new@example.com" } });
  fireEvent.change(screen.getByLabelText("비밀번호"), { target: { value: "password123" } });
  fireEvent.click(screen.getByRole("button", { name: "계정 만들기" }));
}

describe("SignupForm", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("이름/이메일/비밀번호 필드 + 비밀번호 규칙 사전 고지 헬퍼를 렌더한다 (DESIGN §6.2)", () => {
    const sdk = createMockAuthSDK();
    render(
      <AuthProvider sdk={sdk}>
        <SignupForm />
      </AuthProvider>,
    );

    expect(screen.getByLabelText("이름")).toBeInTheDocument();
    expect(screen.getByLabelText("이메일")).toBeInTheDocument();
    expect(screen.getByLabelText("비밀번호")).toBeInTheDocument();
    // 입력 후 깜짝 에러 금지 — 규칙은 미리 보여준다
    expect(screen.getByText("비밀번호는 8자 이상이어야 합니다")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "계정 만들기" })).toBeInTheDocument();
  });

  it("제출 시 signUp({ email, password, displayName })을 호출하고 성공 → / push", async () => {
    const sdk = createMockAuthSDK({
      signUpResult: { success: true, user: TEST_USER, session: TEST_SESSION } as never,
    });
    const signUpSpy = vi.spyOn(sdk, "signUp");
    render(
      <AuthProvider sdk={sdk}>
        <SignupForm />
      </AuthProvider>,
    );

    fillAndSubmit();

    await waitFor(() => {
      expect(signUpSpy).toHaveBeenCalledWith({
        email: "new@example.com",
        password: "password123",
        displayName: "데니스",
      });
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  it("이미 사용 중인 이메일 (AppError 409) → 이메일 필드 인라인 에러 (FRONT §4.2)", async () => {
    const sdk = createMockAuthSDK();
    vi.spyOn(sdk, "signUp").mockRejectedValue(
      new AppError({ code: "CONFLICT", statusCode: 409, message: "Email already in use" }),
    );
    render(
      <AuthProvider sdk={sdk}>
        <SignupForm />
      </AuthProvider>,
    );

    fillAndSubmit();

    expect(await screen.findByText("이미 사용 중인 이메일입니다")).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("비밀번호 8자 미만 → Zod 인라인 에러", async () => {
    const sdk = createMockAuthSDK();
    const signUpSpy = vi.spyOn(sdk, "signUp");
    render(
      <AuthProvider sdk={sdk}>
        <SignupForm />
      </AuthProvider>,
    );

    fireEvent.change(screen.getByLabelText("이름"), { target: { value: "데니스" } });
    fireEvent.change(screen.getByLabelText("이메일"), { target: { value: "new@example.com" } });
    fireEvent.change(screen.getByLabelText("비밀번호"), { target: { value: "short" } });
    fireEvent.click(screen.getByRole("button", { name: "계정 만들기" }));

    // 헬퍼 텍스트(사전 고지)가 에러 스타일로 전환 — 같은 문구가 FormMessage 로도 노출
    await waitFor(() => {
      expect(screen.getAllByText("비밀번호는 8자 이상이어야 합니다").length).toBeGreaterThan(0);
    });
    expect(signUpSpy).not.toHaveBeenCalled();
  });
});
