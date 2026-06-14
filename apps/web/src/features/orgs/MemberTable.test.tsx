import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MemberTable } from "./MemberTable";

// Select 컴포넌트 → native <select> (jsdom 에서 Radix Portal/포지셔닝 불가)
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

const mockGet = vi.fn();

vi.mock("@/lib/http-client", () => ({
  httpClient: {
    get: (...a: unknown[]) => mockGet(...a),
  },
}));

vi.mock("@/lib/supabase-auth", () => ({
  source: { getToken: vi.fn().mockResolvedValue(null) },
  sdk: { signOut: vi.fn() },
  unsubscribe: vi.fn(),
}));

const MEMBERS_PAGE1 = {
  members: [
    { userId: "u-1", orgId: "org-1", role: "owner", email: "alice@x.com", displayName: "Alice" },
    { userId: "u-2", orgId: "org-1", role: "member", email: "bob@x.com", displayName: null },
  ],
  nextCursor: "cursor-abc",
};

const MEMBERS_PAGE2 = {
  members: [
    { userId: "u-3", orgId: "org-1", role: "admin", email: "carol@x.com", displayName: "Carol" },
  ],
  nextCursor: null,
};

function renderTable() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <MemberTable />
    </QueryClientProvider>,
  );
  return { qc };
}

describe("MemberTable (spec-20-03)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue(MEMBERS_PAGE1);
  });

  it("초기 로드 시 멤버 목록과 검색 인풋, 역할 셀렉트가 렌더링된다", async () => {
    renderTable();
    expect(await screen.findByText("alice@x.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("이메일로 검색")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("nextCursor 있을 때 '더 보기' 버튼 노출", async () => {
    renderTable();
    expect(await screen.findByRole("button", { name: "더 보기" })).toBeInTheDocument();
  });

  it("nextCursor null 일 때 '더 보기' 버튼 없음", async () => {
    mockGet.mockResolvedValue({ ...MEMBERS_PAGE1, nextCursor: null });
    renderTable();
    await screen.findByText("alice@x.com");
    expect(screen.queryByRole("button", { name: "더 보기" })).not.toBeInTheDocument();
  });

  it("검색 인풋 입력 시 search 파라미터가 URL 에 포함된다", async () => {
    renderTable();
    await screen.findByText("alice@x.com");

    fireEvent.change(screen.getByPlaceholderText("이메일로 검색"), {
      target: { value: "alice" },
    });

    await waitFor(
      () => {
        const calls = mockGet.mock.calls.map((args: unknown[]) => args[0] as string);
        expect(calls.some((p) => p.includes("search=alice"))).toBe(true);
      },
      { timeout: 1000 },
    );
  });

  it("역할 셀렉트 변경 시 role 파라미터가 URL 에 포함된다", async () => {
    renderTable();
    await screen.findByText("alice@x.com");

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "owner" } });

    await waitFor(() => {
      const calls = mockGet.mock.calls.map((args: unknown[]) => args[0] as string);
      expect(calls.some((p) => p.includes("role=owner"))).toBe(true);
    });
  });

  it("'더 보기' 클릭 시 cursor 파라미터로 다음 페이지 요청, 누적 렌더링", async () => {
    mockGet.mockResolvedValueOnce(MEMBERS_PAGE1).mockResolvedValueOnce(MEMBERS_PAGE2);

    renderTable();
    const loadMore = await screen.findByRole("button", { name: "더 보기" });
    fireEvent.click(loadMore);

    await waitFor(() => {
      expect(screen.getByText("carol@x.com")).toBeInTheDocument();
      expect(screen.getByText("alice@x.com")).toBeInTheDocument();
    });

    const calls = mockGet.mock.calls.map((args: unknown[]) => args[0] as string);
    expect(calls.some((p) => p.includes("cursor="))).toBe(true);
  });
});
