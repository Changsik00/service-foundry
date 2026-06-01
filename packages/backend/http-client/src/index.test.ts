import { runWithRequestId } from "@repo/backend-logger";
import { isAppError } from "@repo/errors";
import { MockAgent, setGlobalDispatcher } from "undici";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";

import { createHttpClient } from "./index.js";

let mockAgent: MockAgent;

beforeEach(() => {
  mockAgent = new MockAgent();
  mockAgent.disableNetConnect();
  setGlobalDispatcher(mockAgent);
});

afterEach(async () => {
  await mockAgent.close();
});

describe("createHttpClient", () => {
  it("baseUrl 적용 — relative path를 baseUrl + path로 합쳐 호출한다", async () => {
    const pool = mockAgent.get("https://api.example.com");
    pool.intercept({ path: "/users/1", method: "GET" }).reply(200, { id: 1, name: "alice" });

    const client = createHttpClient({ baseUrl: "https://api.example.com" });
    const result = await client.get<{ id: number; name: string }>("/users/1");

    expect(result.id).toBe(1);
    expect(result.name).toBe("alice");
  });

  it("default headers 적용 — 사용자 지정 headers가 outbound에 포함된다", async () => {
    const pool = mockAgent.get("https://api.example.com");
    pool
      .intercept({
        path: "/ping",
        method: "GET",
        headers: { "x-api-key": "secret-key" },
      })
      .reply(200, { ok: true });

    const client = createHttpClient({
      baseUrl: "https://api.example.com",
      headers: { "x-api-key": "secret-key" },
    });
    const result = await client.get<{ ok: boolean }>("/ping");
    expect(result.ok).toBe(true);
  });

  it("기본 GET 호출 — 200 JSON body를 typed로 return", async () => {
    const pool = mockAgent.get("https://api.example.com");
    pool.intercept({ path: "/echo", method: "GET" }).reply(200, { msg: "hi" });

    const client = createHttpClient({ baseUrl: "https://api.example.com" });
    const result = await client.get<{ msg: string }>("/echo");
    expect(result.msg).toBe("hi");
  });
});

describe("retry policy", () => {
  it("5xx → retry → 마지막 시도에 200 응답 시 정상 return", async () => {
    const pool = mockAgent.get("https://api.example.com");
    // 1st + 2nd: 503 / 3rd: 200
    pool.intercept({ path: "/flaky", method: "GET" }).reply(503, { error: "down" }).times(2);
    pool.intercept({ path: "/flaky", method: "GET" }).reply(200, { ok: true });

    const client = createHttpClient({
      baseUrl: "https://api.example.com",
      retries: 3,
      retryBackoffMs: 1,
    });
    const result = await client.get<{ ok: boolean }>("/flaky");
    expect(result.ok).toBe(true);
  });

  it("network error retry — undici가 throw하는 케이스", async () => {
    const pool = mockAgent.get("https://api.example.com");
    pool
      .intercept({ path: "/net", method: "GET" })
      .replyWithError(new Error("ECONNREFUSED"))
      .times(2);
    pool.intercept({ path: "/net", method: "GET" }).reply(200, { ok: true });

    const client = createHttpClient({
      baseUrl: "https://api.example.com",
      retries: 3,
      retryBackoffMs: 1,
    });
    const result = await client.get<{ ok: boolean }>("/net");
    expect(result.ok).toBe(true);
  });

  it("max retries 초과 시 AppError UPSTREAM throw", async () => {
    const pool = mockAgent.get("https://api.example.com");
    pool.intercept({ path: "/dead", method: "GET" }).reply(500, { error: "down" }).times(5);

    const client = createHttpClient({
      baseUrl: "https://api.example.com",
      retries: 2,
      retryBackoffMs: 1,
    });
    try {
      await client.get("/dead");
      expect.fail("should have thrown");
    } catch (e) {
      expect(isAppError(e)).toBe(true);
      if (isAppError(e)) {
        expect(e.code).toBe("UPSTREAM");
        expect(e.statusCode).toBe(500);
      }
    }
  });
});

describe("4xx mapping + POST retry policy", () => {
  it("404 → AppError BAD_REQUEST, retry 안 함", async () => {
    const pool = mockAgent.get("https://api.example.com");
    // 단일 intercept — retry 하면 두 번째 호출에서 interceptor 없어 다른 에러가 났을 것.
    pool.intercept({ path: "/missing", method: "GET" }).reply(404, { error: "nope" });

    const client = createHttpClient({
      baseUrl: "https://api.example.com",
      retries: 3,
      retryBackoffMs: 1,
    });
    try {
      await client.get("/missing");
      expect.fail("should have thrown");
    } catch (e) {
      expect(isAppError(e)).toBe(true);
      if (isAppError(e)) {
        expect(e.code).toBe("BAD_REQUEST");
        expect(e.statusCode).toBe(404);
      }
    }
  });

  it("POST 기본 — 5xx 라도 retry 안 함 (1회 시도 후 UPSTREAM)", async () => {
    const pool = mockAgent.get("https://api.example.com");
    pool.intercept({ path: "/create", method: "POST" }).reply(503, { error: "down" });

    const client = createHttpClient({
      baseUrl: "https://api.example.com",
      retries: 3,
      retryBackoffMs: 1,
    });
    try {
      await client.post("/create", { name: "x" });
      expect.fail("should have thrown");
    } catch (e) {
      expect(isAppError(e)).toBe(true);
      if (isAppError(e)) expect(e.code).toBe("UPSTREAM");
    }
  });

  it("POST + 명시 retries → retry 동작", async () => {
    const pool = mockAgent.get("https://api.example.com");
    pool.intercept({ path: "/create", method: "POST" }).reply(503, { error: "down" }).times(2);
    pool.intercept({ path: "/create", method: "POST" }).reply(200, { ok: true });

    const client = createHttpClient({ baseUrl: "https://api.example.com", retryBackoffMs: 1 });
    const result = await client.post<{ ok: boolean }>("/create", { name: "x" }, { retries: 3 });
    expect(result.ok).toBe(true);
  });
});

describe("timeout", () => {
  it("정상 응답 — timeout 안 걸림", async () => {
    const pool = mockAgent.get("https://api.example.com");
    pool.intercept({ path: "/fast", method: "GET" }).reply(200, { ok: true });

    const client = createHttpClient({
      baseUrl: "https://api.example.com",
      timeoutMs: 1000,
    });
    const result = await client.get<{ ok: boolean }>("/fast");
    expect(result.ok).toBe(true);
  });

  it("timeout 시 AppError TIMEOUT throw", async () => {
    const pool = mockAgent.get("https://api.example.com");
    // MockAgent delay → exceeds timeout
    pool.intercept({ path: "/slow", method: "GET" }).reply(200, { ok: true }).delay(200);

    const client = createHttpClient({
      baseUrl: "https://api.example.com",
      timeoutMs: 50,
      retries: 0,
    });
    try {
      await client.get("/slow");
      expect.fail("should have thrown");
    } catch (e) {
      expect(isAppError(e)).toBe(true);
      if (isAppError(e)) {
        expect(e.code).toBe("TIMEOUT");
      }
    }
  });
});

describe("X-Request-Id propagation", () => {
  it("runWithRequestId 안 — outbound X-Request-Id header 자동 attach", async () => {
    const pool = mockAgent.get("https://api.example.com");
    pool
      .intercept({
        path: "/trace",
        method: "GET",
        headers: { "x-request-id": "req-abc-123" },
      })
      .reply(200, { ok: true });

    const client = createHttpClient({ baseUrl: "https://api.example.com" });
    await runWithRequestId("req-abc-123", async () => {
      const result = await client.get<{ ok: boolean }>("/trace");
      expect(result.ok).toBe(true);
    });
  });

  it("runWithRequestId 밖 — X-Request-Id header 없음", async () => {
    const pool = mockAgent.get("https://api.example.com");
    pool
      .intercept({
        path: "/no-trace",
        method: "GET",
        headers: (headers) => !("x-request-id" in headers),
      })
      .reply(200, { ok: true });

    const client = createHttpClient({ baseUrl: "https://api.example.com" });
    const result = await client.get<{ ok: boolean }>("/no-trace");
    expect(result.ok).toBe(true);
  });
});

describe("schema validation", () => {
  const UserSchema = z.object({
    id: z.number(),
    name: z.string(),
  });

  it("schema 인자 있을 때 — 통과 시 typed return / 실패 시 AppError VALIDATION", async () => {
    const pool = mockAgent.get("https://api.example.com");
    // 통과 케이스
    pool.intercept({ path: "/valid", method: "GET" }).reply(200, { id: 1, name: "alice" });
    // 실패 케이스 (name 누락)
    pool.intercept({ path: "/invalid", method: "GET" }).reply(200, { id: 1 });

    const client = createHttpClient({ baseUrl: "https://api.example.com" });

    const valid = await client.get("/valid", { schema: UserSchema });
    expect(valid.name).toBe("alice");

    try {
      await client.get("/invalid", { schema: UserSchema });
      expect.fail("should have thrown");
    } catch (e) {
      expect(isAppError(e)).toBe(true);
      if (isAppError(e)) {
        expect(e.code).toBe("VALIDATION");
      }
    }
  });
});
