import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OrgTable } from "./OrgTable";

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

const ORGS_PAGE1 = {
  orgs: [
    {
      id: "org-1",
      name: "Acme",
      slug: "acme",
      isPersonal: false,
      ownerId: "u-1",
      createdAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "org-2",
      name: "Beta",
      slug: "beta",
      isPersonal: true,
      ownerId: "u-2",
      createdAt: "2024-01-02T00:00:00Z",
    },
  ],
  nextCursor: "cursor-abc",
};

const ORGS_PAGE2 = {
  orgs: [
    {
      id: "org-3",
      name: "Gamma",
      slug: "gamma",
      isPersonal: false,
      ownerId: "u-3",
      createdAt: "2024-01-03T00:00:00Z",
    },
  ],
  nextCursor: null,
};

function renderTable() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <OrgTable />
    </QueryClientProvider>,
  );
  return { qc };
}

describe("OrgTable (spec-21-01)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue(ORGS_PAGE1);
  });

  it("초기 로드 시 조직 목록과 검색 인풋이 렌더링된다", async () => {
    renderTable();
    expect(await screen.findByText("Acme")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("조직 이름·슬러그 검색")).toBeInTheDocument();
  });

  it("nextCursor 있을 때 '더 보기' 버튼 노출", async () => {
    renderTable();
    expect(await screen.findByText("Acme")).toBeInTheDocument();
    expect(screen.getByText("더 보기")).toBeInTheDocument();
  });

  it("nextCursor null 이면 '더 보기' 버튼 미노출", async () => {
    mockGet.mockResolvedValueOnce({ ...ORGS_PAGE1, nextCursor: null });
    renderTable();
    await screen.findByText("Acme");
    expect(screen.queryByText("더 보기")).not.toBeInTheDocument();
  });

  it("'더 보기' 클릭 시 두 번째 페이지 로드 + 누적", async () => {
    mockGet.mockResolvedValueOnce(ORGS_PAGE1).mockResolvedValueOnce(ORGS_PAGE2);
    renderTable();
    await screen.findByText("Acme");
    fireEvent.click(screen.getByText("더 보기"));
    await waitFor(() => expect(screen.getByText("Gamma")).toBeInTheDocument());
    expect(screen.getByText("Acme")).toBeInTheDocument();
  });

  it("search 입력 → httpClient.get 경로에 search 쿼리 파라미터 포함", async () => {
    renderTable();
    await screen.findByText("Acme");
    fireEvent.change(screen.getByPlaceholderText("조직 이름·슬러그 검색"), {
      target: { value: "acme" },
    });
    await waitFor(() => {
      const [path] = mockGet.mock.calls.at(-1) as unknown[];
      expect(path).toContain("search=acme");
    });
  });
});
