import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/http-client", () => ({
  httpClient: { get: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import { ProfileForm } from "./ProfileForm";

const mockMutate = vi.fn();

vi.mock("./mutations", () => ({
  useUpdateProfile: vi.fn(),
  useUploadAvatar: vi.fn(),
}));

import { useUpdateProfile, useUploadAvatar } from "./mutations";

const meData = {
  user: {
    id: "usr_TEST00000000000000000000XY",
    email: "u@example.com",
    role: "user",
    orgId: "org-1",
    displayName: "홍길동",
  },
};

function makeWrapper(qc: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: qc }, children);
  };
}

describe("ProfileForm", () => {
  let qc: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    qc.setQueryData(["auth", "me"], meData);
    vi.mocked(useUpdateProfile).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useUpdateProfile>);
    vi.mocked(useUploadAvatar).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useUploadAvatar>);
  });

  it("현재 displayName이 input에 prefill된다", () => {
    render(<ProfileForm />, { wrapper: makeWrapper(qc) });
    expect(screen.getByDisplayValue("홍길동")).toBeInTheDocument();
  });

  it("submit 시 useUpdateProfile mutate 호출", async () => {
    render(<ProfileForm />, { wrapper: makeWrapper(qc) });

    const input = screen.getByDisplayValue("홍길동");
    fireEvent.change(input, { target: { value: "김철수" } });
    fireEvent.click(screen.getByRole("button", { name: /저장/ }));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({ displayName: "김철수" });
    });
  });

  it("에러 시 인라인 에러 메시지 표시", () => {
    vi.mocked(useUpdateProfile).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: true,
      error: new Error("저장 실패"),
    } as unknown as ReturnType<typeof useUpdateProfile>);

    render(<ProfileForm />, { wrapper: makeWrapper(qc) });
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
