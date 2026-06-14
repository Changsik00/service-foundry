import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FeatureFlagTable } from "./FeatureFlagTable";

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockPatch = vi.fn();
const mockDelete = vi.fn();

vi.mock("@/lib/http-client", () => ({
  httpClient: {
    get: (...a: unknown[]) => mockGet(...a),
    post: (...a: unknown[]) => mockPost(...a),
    patch: (...a: unknown[]) => mockPatch(...a),
    delete: (...a: unknown[]) => mockDelete(...a),
  },
}));

vi.mock("@/lib/supabase-auth", () => ({
  source: { getToken: vi.fn().mockResolvedValue(null) },
  sdk: { signOut: vi.fn() },
  unsubscribe: vi.fn(),
}));

const FLAGS = [
  {
    id: "flag-1",
    key: "new-dashboard",
    description: "신규 대시보드",
    enabled: true,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "flag-2",
    key: "beta-export",
    description: null,
    enabled: false,
    createdAt: "2024-01-02T00:00:00Z",
  },
];

function renderTable() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <FeatureFlagTable />
    </QueryClientProvider>,
  );
  return { qc };
}

describe("FeatureFlagTable (spec-21-02)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue(FLAGS);
  });

  it("피처플래그 목록과 생성 폼이 렌더링된다", async () => {
    renderTable();
    expect(await screen.findByText("new-dashboard")).toBeInTheDocument();
    expect(screen.getByText("beta-export")).toBeInTheDocument();
    expect(screen.getByLabelText("플래그 키")).toBeInTheDocument();
  });

  it("활성 플래그는 '끄기', 비활성 플래그는 '켜기' 버튼을 보여준다", async () => {
    renderTable();
    await screen.findByText("new-dashboard");
    const buttons = screen.getAllByRole("button");
    const labels = buttons.map((b) => b.textContent);
    expect(labels).toContain("끄기");
    expect(labels).toContain("켜기");
  });

  it("'켜기' 버튼 클릭 시 PATCH 호출된다", async () => {
    mockPatch.mockResolvedValue({ ...FLAGS[1], enabled: true });
    mockGet.mockResolvedValue(FLAGS);
    renderTable();
    await screen.findByText("beta-export");
    const toggleButtons = screen.getAllByText("켜기");
    fireEvent.click(toggleButtons[0]!);
    await waitFor(() => expect(mockPatch).toHaveBeenCalled());
    const [path] = mockPatch.mock.calls[0] as unknown[];
    expect(path).toContain("beta-export");
  });

  it("플래그 추가 폼 제출 시 POST 호출된다", async () => {
    mockPost.mockResolvedValue({ ...FLAGS[0], key: "my-new-flag" });
    mockGet.mockResolvedValue(FLAGS);
    renderTable();
    await screen.findByText("new-dashboard");
    fireEvent.change(screen.getByLabelText("플래그 키"), {
      target: { value: "my-new-flag" },
    });
    fireEvent.click(screen.getByText("추가"));
    await waitFor(() => expect(mockPost).toHaveBeenCalled());
    const [path] = mockPost.mock.calls[0] as unknown[];
    expect(path).toContain("/admin/feature-flags");
  });

  it("'삭제' 버튼 클릭 시 DELETE 호출된다", async () => {
    mockDelete.mockResolvedValue(undefined);
    mockGet.mockResolvedValue(FLAGS);
    renderTable();
    await screen.findByText("new-dashboard");
    const deleteButtons = screen.getAllByText("삭제");
    fireEvent.click(deleteButtons[0]!);
    await waitFor(() => expect(mockDelete).toHaveBeenCalled());
    const [path] = mockDelete.mock.calls[0] as unknown[];
    expect(path).toContain("/admin/feature-flags/");
  });
});
