import { AppError } from "@repo/errors";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { createSdk, type Sdk } from "./index.js";

const baseUrl = "https://api.test";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

let fetchMock: ReturnType<typeof vi.fn>;
let sdk: Sdk;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  sdk = createSdk({ baseUrl, retries: 2, retryBackoffMs: 0 });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createSdk", () => {
  it("GET 200 + schema parse → 결과 반환", async () => {
    const schema = z.object({ id: z.string(), name: z.string() });
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: "u1", name: "Alice" }));

    const result = await sdk.get("/users/u1", { schema });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ id: "u1", name: "Alice" });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url.toString()).toBe(`${baseUrl}/users/u1`);
    expect(init.method).toBe("GET");
  });

  it("GET 404 → AppError(BAD_REQUEST)", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: "not found" }, 404));

    await expect(sdk.get("/missing")).rejects.toMatchObject({
      code: "BAD_REQUEST",
      statusCode: 404,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1); // no retry on 4xx
  });

  it("GET 500 → retry 후 AppError(UPSTREAM)", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: "boom" }, 500));

    await expect(sdk.get("/users")).rejects.toMatchObject({
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

    await expect(sdk.get("/slow", { timeoutMs: 10 })).rejects.toBeInstanceOf(AppError);
    await expect(sdk.get("/slow", { timeoutMs: 10 })).rejects.toMatchObject({ code: "TIMEOUT" });
  });

  it("network error → AppError(NETWORK)", async () => {
    fetchMock.mockRejectedValue(new TypeError("network fail"));

    await expect(sdk.get("/users")).rejects.toMatchObject({ code: "NETWORK" });
  });

  it("schema validation fail → AppError(VALIDATION)", async () => {
    const schema = z.object({ id: z.string(), age: z.number() });
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: "u1", age: "wrong-type" }));

    await expect(sdk.get("/users/u1", { schema })).rejects.toMatchObject({
      code: "VALIDATION",
    });
  });

  it("POST default (retries 미박힘) → 1회만 시도", async () => {
    sdk = createSdk({ baseUrl, retries: 3, retryBackoffMs: 0 });
    fetchMock.mockResolvedValue(jsonResponse({ error: "boom" }, 500));

    await expect(sdk.post("/users", { name: "Alice" })).rejects.toMatchObject({
      code: "UPSTREAM",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1); // POST default no retry
  });

  it("POST with retries opt → retry 동작", async () => {
    sdk = createSdk({ baseUrl, retries: 3, retryBackoffMs: 0 });
    fetchMock.mockResolvedValue(jsonResponse({ error: "boom" }, 500));

    await expect(sdk.post("/users", { name: "Alice" }, { retries: 2 })).rejects.toMatchObject({
      code: "UPSTREAM",
    });
    expect(fetchMock.mock.calls.length).toBeGreaterThan(1); // retry 발생
  });

  it("headers override + body JSON serialize", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));

    await sdk.post("/users", { name: "Alice" }, { headers: { "x-request-id": "trace-1" } });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("POST");
    const headers = new Headers(init.headers);
    expect(headers.get("x-request-id")).toBe("trace-1");
    expect(init.body).toBe(JSON.stringify({ name: "Alice" }));
  });
});
