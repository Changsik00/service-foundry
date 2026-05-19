import { isAppError } from "@repo/errors";
import { MockAgent, setGlobalDispatcher } from "undici";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

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
