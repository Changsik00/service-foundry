import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
  type ApiCallOptions,
  createApiClient,
  type HttpClient,
  type HttpRequestOptions,
} from "./index.js";

const UserSchema = z.object({ id: z.number(), name: z.string() });

/** request 호출을 기록하고 스키마를 실제 적용하는 fake HttpClient */
function fakeClient(raw: unknown) {
  const calls: HttpRequestOptions<unknown>[] = [];
  const http: HttpClient = {
    request: vi.fn(async (opts: HttpRequestOptions<unknown>) => {
      calls.push(opts);
      return opts.schema ? opts.schema.parse(raw) : raw;
    }) as HttpClient["request"],
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  } as unknown as HttpClient;
  return { http, calls };
}

const endpoints = {
  getUser: { method: "GET" as const, path: "/users/1", response: UserSchema },
  createUser: { method: "POST" as const, path: "/users", response: UserSchema },
};

describe("createApiClient", () => {
  it("엔드포인트 정의(method/path/schema)를 request 에 바인딩한다", async () => {
    const { http, calls } = fakeClient({ id: 1, name: "a" });
    const api = createApiClient(http, endpoints);
    await api.getUser();
    expect(calls[0]?.method).toBe("GET");
    expect(calls[0]?.path).toBe("/users/1");
    expect(calls[0]?.schema).toBe(UserSchema);
  });

  it("반환값은 response 스키마로 검증된 타입이다", async () => {
    const { http } = fakeClient({ id: 7, name: "neo" });
    const api = createApiClient(http, endpoints);
    const user = await api.getUser();
    expect(user).toEqual({ id: 7, name: "neo" });
  });

  it("body / headers / path override 를 전달한다", async () => {
    const { http, calls } = fakeClient({ id: 1, name: "a" });
    const api = createApiClient(http, endpoints);
    const opts: ApiCallOptions = {
      body: { name: "x" },
      headers: { "x-test": "1" },
      path: "/users/99",
    };
    await api.createUser(opts);
    expect(calls[0]?.method).toBe("POST");
    expect(calls[0]?.path).toBe("/users/99");
    expect(calls[0]?.body).toEqual({ name: "x" });
    expect(calls[0]?.headers).toEqual({ "x-test": "1" });
  });

  it("응답이 스키마에 맞지 않으면 throw", async () => {
    const { http } = fakeClient({ id: "not-number", name: "a" });
    const api = createApiClient(http, endpoints);
    await expect(api.getUser()).rejects.toThrow();
  });
});
