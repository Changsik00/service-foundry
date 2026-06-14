import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { InviteForm } from "./InviteForm";

// Select 컴포넌트 → native <select> (jsdom 에서 Radix Portal/레이블 연결 불가)
vi.mock("@repo/frontend-ui", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@repo/frontend-ui")>();
  const { createElement, Fragment } = await import("react");
  // biome-ignore lint/suspicious/noExplicitAny: test mock
  const pass = ({ children }: any) => createElement(Fragment, null, children);
  const nil = () => null;
  return {
    ...mod,
    // biome-ignore lint/suspicious/noExplicitAny: test mock
    Select: ({ value, onValueChange, children, ...rest }: any) =>
      createElement(
        "select",
        { value: value ?? "", onChange: (e: any) => onValueChange?.(e.target.value), ...rest },
        children,
      ),
    SelectTrigger: pass,
    SelectValue: nil,
    SelectContent: pass,
    // biome-ignore lint/suspicious/noExplicitAny: test mock
    SelectItem: ({ value, children }: any) => createElement("option", { value }, children),
    SelectGroup: pass,
    SelectLabel: pass,
    SelectSeparator: nil,
    SelectScrollUpButton: nil,
    SelectScrollDownButton: nil,
  };
});

const mockPost = vi.fn();
vi.mock("@/lib/http-client", () => ({
  httpClient: {
    get: vi.fn(),
    post: (...a: unknown[]) => mockPost(...a),
  },
}));

function renderForm() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={qc}>
      <InviteForm />
    </QueryClientProvider>,
  );
}

describe("InviteForm", () => {
  beforeEach(() => vi.clearAllMocks());

  it("이메일+역할 제출 → invite API 호출 + 완료 안내", async () => {
    mockPost.mockResolvedValue({ status: "ok" });
    renderForm();

    fireEvent.change(screen.getByLabelText("이메일"), { target: { value: "new@example.com" } });
    fireEvent.change(screen.getByLabelText("역할"), { target: { value: "admin" } });
    fireEvent.click(screen.getByRole("button", { name: "초대 보내기" }));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith(
        "/auth/org/invite",
        { email: "new@example.com", role: "admin" },
        expect.objectContaining({ requiresAuth: true }),
      );
    });
    expect(await screen.findByText("초대 이메일을 보냈습니다")).toBeInTheDocument();
  });

  it("403 (권한 부족) → 인라인 에러", async () => {
    mockPost.mockRejectedValue(Object.assign(new Error("forbidden"), { statusCode: 403 }));
    renderForm();

    fireEvent.change(screen.getByLabelText("이메일"), { target: { value: "new@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "초대 보내기" }));

    expect(
      await screen.findByText("초대 권한이 없습니다 (owner·admin 만 가능)"),
    ).toBeInTheDocument();
  });
});
