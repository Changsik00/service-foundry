import type { AuthSource, AuthStatus } from "@repo/auth-contracts";
import { AppError } from "@repo/errors";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { createHttpClient, type HttpClient } from "./index.js";

function makeAuthSource(status: AuthStatus, token: string | null): AuthSource {
  return {
    status,
    getToken: async () => token,
    refresh: vi.fn().mockResolvedValue(undefined),
    waitUntilSettled: async () => {},
  };
}

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

describe("AuthSource 주입 (auth option)", () => {
  it("auth 없음 — Authorization 헤더 없이 진행", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));
    await client.get("/public");
    const [req] = fetchMock.mock.calls[0] as [Request];
    expect(req.headers.get("authorization")).toBeNull();
  });

  it("authenticated + token → Authorization: Bearer 헤더 붙음", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));
    const auth = makeAuthSource("authenticated", "tok_abc");
    const authClient = createHttpClient({ baseUrl, retries: 0, auth });
    await authClient.get("/me");
    const [req] = fetchMock.mock.calls[0] as [Request];
    expect(req.headers.get("authorization")).toBe("Bearer tok_abc");
  });

  it("unauthenticated + requiresAuth=false → token 없이 진행 (공개 API)", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));
    const auth = makeAuthSource("unauthenticated", null);
    const authClient = createHttpClient({ baseUrl, retries: 0, auth });
    await authClient.get("/public");
    const [req] = fetchMock.mock.calls[0] as [Request];
    expect(req.headers.get("authorization")).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("unauthenticated + requiresAuth=true → AppError(401) 즉시 throw, fetch 0회", async () => {
    const auth = makeAuthSource("unauthenticated", null);
    const authClient = createHttpClient({ baseUrl, retries: 0, auth });
    await expect(authClient.get("/protected", { requiresAuth: true })).rejects.toMatchObject({
      statusCode: 401,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("unknown → waitUntilSettled 후 authenticated → token 붙여서 진행", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));
    let currentStatus: AuthStatus = "unknown";
    let currentToken: string | null = null;
    const auth: AuthSource = {
      get status() {
        return currentStatus;
      },
      getToken: async () => currentToken,
      refresh: vi.fn(),
      waitUntilSettled: async () => {
        // settled 시뮬레이션
        currentStatus = "authenticated";
        currentToken = "tok_settled";
      },
    };
    const authClient = createHttpClient({ baseUrl, retries: 0, auth });
    await authClient.get("/me");
    const [req] = fetchMock.mock.calls[0] as [Request];
    expect(req.headers.get("authorization")).toBe("Bearer tok_settled");
  });

  it("authenticated + 401 → refresh + 재시도 (fetch 2회, 2회차엔 새 토큰 사용)", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ error: "expired" }, 401))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));

    let currentToken = "tok_old";
    const auth: AuthSource = {
      status: "authenticated",
      getToken: vi.fn(async () => currentToken),
      refresh: vi.fn(async () => {
        currentToken = "tok_new";
      }),
      waitUntilSettled: async () => {},
    };
    const authClient = createHttpClient({ baseUrl, retries: 0, auth });
    await authClient.get("/me");

    expect(auth.refresh).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    // 1회차: old token
    expect((fetchMock.mock.calls[0] as [Request])[0].headers.get("authorization")).toBe(
      "Bearer tok_old",
    );
    // 2회차: refresh 후 새 token
    expect((fetchMock.mock.calls[1] as [Request])[0].headers.get("authorization")).toBe(
      "Bearer tok_new",
    );
  });

  it("authenticated + 401 + token null → refresh 안 함, 즉시 throw", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: "unauthorized" }, 401));
    const auth = makeAuthSource("authenticated", null);
    const authClient = createHttpClient({ baseUrl, retries: 0, auth });
    await expect(authClient.get("/me")).rejects.toMatchObject({ statusCode: 401 });
    expect(auth.refresh).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("authenticated + 401 → refresh 실패 → 원래 401 AppError 전파", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: "expired" }, 401));
    const auth: AuthSource = {
      ...makeAuthSource("authenticated", "tok"),
      refresh: vi.fn().mockRejectedValue(new Error("network fail")),
    };
    const authClient = createHttpClient({ baseUrl, retries: 0, auth });
    await expect(authClient.get("/me")).rejects.toMatchObject({ statusCode: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("authenticated + 401 → refresh 성공 → 재시도도 401 → AppError(401), 루프 없음", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ error: "expired" }, 401))
      .mockResolvedValueOnce(jsonResponse({ error: "still 401" }, 401));
    const auth = makeAuthSource("authenticated", "tok");
    const authClient = createHttpClient({ baseUrl, retries: 0, auth });
    await expect(authClient.get("/me")).rejects.toMatchObject({ statusCode: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
