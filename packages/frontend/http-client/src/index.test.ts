import { AppError } from "@repo/errors";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { createHttpClient, type HttpClient } from "./index.js";

const baseUrl = "https://api.test";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

let fetchMock: ReturnType<typeof vi.fn>;
let client: HttpClient;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  client = createHttpClient({ baseUrl, retries: 2, retryBackoffMs: 0 });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createHttpClient", () => {
  it("GET 200 + schema parse → 결과 반환", async () => {
    const schema = z.object({ id: z.string(), name: z.string() });
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: "u1", name: "Alice" }));

    const result = await client.get("/users/u1", { schema });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ id: "u1", name: "Alice" });
    const [request] = fetchMock.mock.calls[0] as [Request];
    expect(request.url).toBe(`${baseUrl}/users/u1`);
    expect(request.method).toBe("GET");
  });

  it("GET 404 → AppError(BAD_REQUEST)", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: "not found" }, 404));

    await expect(client.get("/missing")).rejects.toMatchObject({
      code: "BAD_REQUEST",
      statusCode: 404,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1); // no retry on 4xx
  });

  it("GET 500 → retry 후 AppError(UPSTREAM)", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: "boom" }, 500));

    await expect(client.get("/users")).rejects.toMatchObject({
      code: "UPSTREAM",
      statusCode: 500,
    });
    expect(fetchMock.mock.calls.length).toBeGreaterThan(1); // retry 발생
  });

  it("timeout → AppError(TIMEOUT)", async () => {
    fetchMock.mockImplementation(
      () =>
        new Promise(() => {
          /* never resolve */
        }),
    );

    await expect(client.get("/slow", { timeoutMs: 10 })).rejects.toBeInstanceOf(AppError);
    await expect(client.get("/slow", { timeoutMs: 10 })).rejects.toMatchObject({ code: "TIMEOUT" });
  });

  it("network error → AppError(NETWORK)", async () => {
    fetchMock.mockRejectedValue(new TypeError("network fail"));

    await expect(client.get("/users")).rejects.toMatchObject({ code: "NETWORK" });
  });

  it("schema validation fail → AppError(VALIDATION)", async () => {
    const schema = z.object({ id: z.string(), age: z.number() });
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: "u1", age: "wrong-type" }));

    await expect(client.get("/users/u1", { schema })).rejects.toMatchObject({
      code: "VALIDATION",
    });
  });

  it("POST default (retries 미박힘) → 1회만 시도", async () => {
    client = createHttpClient({ baseUrl, retries: 3, retryBackoffMs: 0 });
    fetchMock.mockResolvedValue(jsonResponse({ error: "boom" }, 500));

    await expect(client.post("/users", { name: "Alice" })).rejects.toMatchObject({
      code: "UPSTREAM",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1); // POST default no retry
  });

  it("POST with retries opt → retry 동작", async () => {
    client = createHttpClient({ baseUrl, retries: 3, retryBackoffMs: 0 });
    fetchMock.mockResolvedValue(jsonResponse({ error: "boom" }, 500));

    await expect(client.post("/users", { name: "Alice" }, { retries: 2 })).rejects.toMatchObject({
      code: "UPSTREAM",
    });
    expect(fetchMock.mock.calls.length).toBeGreaterThan(1); // retry 발생
  });

  describe("onUnauthorized interceptor", () => {
    it("요청 성공 (2xx) → onUnauthorized 미호출, fetch 1회", async () => {
      const onUnauthorized = vi.fn();
      const c = createHttpClient({ baseUrl, retries: 0, onUnauthorized });
      fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));

      await c.get("/me");

      expect(onUnauthorized).not.toHaveBeenCalled();
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("401 → onUnauthorized 호출 → 재시도 성공 → 결과 반환, fetch 2회", async () => {
      const onUnauthorized = vi.fn().mockResolvedValue(undefined);
      const c = createHttpClient({ baseUrl, retries: 0, onUnauthorized });
      fetchMock
        .mockResolvedValueOnce(jsonResponse({ error: "unauthorized" }, 401))
        .mockResolvedValueOnce(jsonResponse({ data: "ok" }));

      const result = await c.get("/me");

      expect(result).toEqual({ data: "ok" });
      expect(onUnauthorized).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("401 → onUnauthorized 실패 → AppError(statusCode:401), fetch 1회", async () => {
      const onUnauthorized = vi.fn().mockRejectedValue(new Error("refresh failed"));
      const c = createHttpClient({ baseUrl, retries: 0, onUnauthorized });
      fetchMock.mockResolvedValueOnce(jsonResponse({ error: "unauthorized" }, 401));

      await expect(c.get("/me")).rejects.toMatchObject({ statusCode: 401 });
      expect(onUnauthorized).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("401 → onUnauthorized 성공 → 재시도도 401 → AppError(401), fetch 2회, 루프 없음", async () => {
      const onUnauthorized = vi.fn().mockResolvedValue(undefined);
      const c = createHttpClient({ baseUrl, retries: 0, onUnauthorized });
      fetchMock
        .mockResolvedValueOnce(jsonResponse({ error: "unauthorized" }, 401))
        .mockResolvedValueOnce(jsonResponse({ error: "still unauthorized" }, 401));

      await expect(c.get("/me")).rejects.toMatchObject({ statusCode: 401 });
      expect(onUnauthorized).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  it("headers override + body JSON serialize", async () => {
    fetchMock.mockImplementation(async (req: Request) => {
      // clone 후 body 읽음 — ky 가 이미 읽었을 수 있음
      const body = await req.clone().text();
      return new Response(JSON.stringify({ echoBody: body }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });

    await client.post("/users", { name: "Alice" }, { headers: { "x-request-id": "trace-1" } });

    const [request] = fetchMock.mock.calls[0] as [Request];
    expect(request.method).toBe("POST");
    expect(request.headers.get("x-request-id")).toBe("trace-1");
    expect(request.headers.get("content-type")).toMatch(/application\/json/);
  });
});
