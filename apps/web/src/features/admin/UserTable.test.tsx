import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UserTable } from "./UserTable";

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

const USERS_PAGE1 = {
  users: [
    {
      id: "u-1",
      email: "alice@x.com",
      displayName: "Alice",
      role: "admin",
      orgId: "org-1",
      createdAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "u-2",
      email: "bob@x.com",
      displayName: null,
      role: "user",
      orgId: "org-1",
      createdAt: "2024-01-02T00:00:00Z",
    },
  ],
  nextCursor: "cursor-xyz",
};

const USERS_PAGE2 = {
  users: [
    {
      id: "u-3",
      email: "carol@x.com",
      displayName: "Carol",
      role: "user",
      orgId: null,
      createdAt: "2024-01-03T00:00:00Z",
    },
  ],
  nextCursor: null,
};

function renderTable() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <UserTable />
    </QueryClientProvider>,
  );
  return { qc };
}

describe("UserTable (spec-21-01)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue(USERS_PAGE1);
  });

  it("초기 로드 시 유저 목록과 검색 인풋이 렌더링된다", async () => {
    renderTable();
    expect(await screen.findByText("alice@x.com")).toBeInTheDocument();
    expect(screen.getByText("bob@x.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("이메일·이름 검색")).toBeInTheDocument();
  });

  it("nextCursor 있을 때 '더 보기' 버튼 노출", async () => {
    renderTable();
    await screen.findByText("alice@x.com");
    expect(screen.getByText("더 보기")).toBeInTheDocument();
  });

  it("nextCursor null 이면 '더 보기' 버튼 미노출", async () => {
    mockGet.mockResolvedValueOnce({ ...USERS_PAGE1, nextCursor: null });
    renderTable();
    await screen.findByText("alice@x.com");
    expect(screen.queryByText("더 보기")).not.toBeInTheDocument();
  });

  it("'더 보기' 클릭 시 두 번째 페이지 로드 + 누적", async () => {
    mockGet.mockResolvedValueOnce(USERS_PAGE1).mockResolvedValueOnce(USERS_PAGE2);
    renderTable();
    await screen.findByText("alice@x.com");
    fireEvent.click(screen.getByText("더 보기"));
    await waitFor(() => expect(screen.getByText("carol@x.com")).toBeInTheDocument());
    expect(screen.getByText("alice@x.com")).toBeInTheDocument();
  });

  it("search 입력 → httpClient.get 경로에 search 쿼리 파라미터 포함", async () => {
    renderTable();
    await screen.findByText("alice@x.com");
    fireEvent.change(screen.getByPlaceholderText("이메일·이름 검색"), {
      target: { value: "alice" },
    });
    await waitFor(() => {
      const [path] = mockGet.mock.calls.at(-1) as unknown[];
      expect(path).toContain("search=alice");
    });
  });
});
