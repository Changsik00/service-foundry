import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useHealthQuery } from "./queries.js";

let fetchMock: ReturnType<typeof vi.fn>;

function makeWrapper(): (props: { children: ReactNode }) => React.ReactElement {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useHealthQuery", () => {
  it("success → data 박힘 (status/uptime/version)", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: "ok", uptime: 1.23, version: "0.0.0" }));

    const { result } = renderHook(() => useHealthQuery(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.data).toEqual({ status: "ok", uptime: 1.23, version: "0.0.0" });
  });

  it("error → isError + error 박힘", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: "boom" }, 500));

    const { result } = renderHook(() => useHealthQuery(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(result.current.error).toBeDefined();
  });

  it("initial → isLoading true (queryFn 호출 전)", () => {
    // pending — fetchMock 안 박힘, queryFn 실행 직전 동기 검증
    fetchMock.mockImplementation(() => new Promise(() => {}));

    const { result } = renderHook(() => useHealthQuery(), { wrapper: makeWrapper() });

    expect(result.current.isLoading).toBe(true);
  });
});
