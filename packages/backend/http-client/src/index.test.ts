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
