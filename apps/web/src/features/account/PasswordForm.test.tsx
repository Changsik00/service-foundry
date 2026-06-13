import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/http-client", () => ({
  httpClient: { get: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

vi.mock("./mutations", () => ({
  useChangePassword: vi.fn(),
}));

import { useChangePassword } from "./mutations";
import { PasswordForm } from "./PasswordForm";

const mockMutate = vi.fn();

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: qc }, children);
  };
}

describe("PasswordForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useChangePassword).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useChangePassword>);
  });

  it("confirm 불일치 시 클라이언트 에러 표시, mutate 미호출", async () => {
    render(<PasswordForm />, { wrapper: makeWrapper() });

    fireEvent.change(screen.getByLabelText("현재 비밀번호"), { target: { value: "OldPass1!" } });
    fireEvent.change(screen.getByLabelText("새 비밀번호"), { target: { value: "NewPass2!" } });
    fireEvent.change(screen.getByLabelText("새 비밀번호 확인"), {
      target: { value: "Different!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /변경/ }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("정상 submit 시 useChangePassword mutate 호출", async () => {
    render(<PasswordForm />, { wrapper: makeWrapper() });

    fireEvent.change(screen.getByLabelText("현재 비밀번호"), { target: { value: "OldPass1!" } });
    fireEvent.change(screen.getByLabelText("새 비밀번호"), { target: { value: "NewPass2!" } });
    fireEvent.change(screen.getByLabelText("새 비밀번호 확인"), { target: { value: "NewPass2!" } });
    fireEvent.click(screen.getByRole("button", { name: /변경/ }));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        currentPassword: "OldPass1!",
        newPassword: "NewPass2!",
      });
    });
  });

  it("API 에러 시 인라인 에러 메시지 표시", () => {
    vi.mocked(useChangePassword).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: true,
      error: new Error("현재 비밀번호가 틀렸습니다"),
    } as unknown as ReturnType<typeof useChangePassword>);

    render(<PasswordForm />, { wrapper: makeWrapper() });
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("현재 비밀번호가 틀렸습니다")).toBeInTheDocument();
  });
});
