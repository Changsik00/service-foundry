import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TenantSwitcher } from "./TenantSwitcher";

const mockGet = vi.fn();
const mockPost = vi.fn();

vi.mock("@/lib/http-client", () => ({
  httpClient: {
    get: (...a: unknown[]) => mockGet(...a),
    post: (...a: unknown[]) => mockPost(...a),
  },
}));

const ORGS = {
  orgs: [
    { orgId: "org-1", name: "personal", role: "owner", isPersonal: true },
    { orgId: "org-2", name: "acme", role: "member", isPersonal: false },
  ],
};
const ME = { user: { sub: "uid-1", role: "user", orgId: "org-1" } };

function renderSwitcher() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
  render(
    <QueryClientProvider client={qc}>
      <TenantSwitcher />
    </QueryClientProvider>,
  );
  return { qc, invalidateSpy };
}

describe("TenantSwitcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockImplementation((path: unknown) =>
      path === "/auth/orgs" ? Promise.resolve(ORGS) : Promise.resolve(ME),
    );
    mockPost.mockResolvedValue({ orgId: "org-2" });
  });

  it("active 조직명을 트리거에 표시한다", async () => {
    renderSwitcher();
    expect(await screen.findByRole("button", { name: /personal/ })).toBeInTheDocument();
  });

  it("드롭다운에 조직 목록 + 역할 표시, 다른 조직 클릭 → switch API + 전체 쿼리 invalidate", async () => {
    const { invalidateSpy } = renderSwitcher();

    // Radix 트리거는 jsdom 에서 click 미반응 — keyboard 로 오픈
    const trigger = await screen.findByRole("button", { name: /personal/ });
    fireEvent.keyDown(trigger, { key: "Enter" });
    const target = await screen.findByText("acme");
    expect(screen.getByText("member")).toBeInTheDocument();

    fireEvent.click(target);

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith(
        "/auth/org/switch",
        { orgId: "org-2" },
        expect.objectContaining({ requiresAuth: true }),
      );
      // ADR-0026: 토큰 불변 — org 스코프 데이터 전부 무효화
      expect(invalidateSpy).toHaveBeenCalledWith();
    });
  });
});
