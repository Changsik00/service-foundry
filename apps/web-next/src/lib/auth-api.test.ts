import type { HttpClient } from "@repo/frontend-http-client";
import { describe, expect, it, vi } from "vitest";
import { createAuthApi } from "./auth-api.js";

/** http-client 가 비-2xx 를 변환하는 AppError 형태(statusCode 포함)를 모사. */
const httpError = (statusCode: number): Error & { statusCode: number } =>
  Object.assign(new Error(`HTTP ${statusCode}`), { statusCode });

const mockHttp = (get: HttpClient["get"], post: HttpClient["post"]): HttpClient =>
  ({ get, post }) as unknown as HttpClient;

describe("createAuthApi — CSRF 403 자가복구 (spec-16-03)", () => {
  it("보호 POST 403 → csrf 재발급 후 1회 재시도 성공", async () => {
    let csrfN = 0;
    const get = vi.fn(async () => ({ csrfToken: `tok-${++csrfN}` }));
    let postN = 0;
    const post = vi.fn(async () => {
      postN += 1;
      if (postN === 1) throw httpError(403);
      return { accessToken: "a", csrfToken: "rotated" };
    });
    const api = createAuthApi(mockHttp(get as never, post as never));

    const res = await api.signIn({ email: "e", password: "p" });

    expect(res).toMatchObject({ accessToken: "a" });
    expect(post).toHaveBeenCalledTimes(2); // 최초 + 재시도 1
    expect(get).toHaveBeenCalledTimes(2); // ensureCsrf + 재발급
  });

  it("재시도도 403 이면 throw (post 2회 — 무한루프 없음)", async () => {
    const get = vi.fn(async () => ({ csrfToken: "tok" }));
    const post = vi.fn(async () => {
      throw httpError(403);
    });
    const api = createAuthApi(mockHttp(get as never, post as never));

    await expect(api.refresh()).rejects.toMatchObject({ statusCode: 403 });
    expect(post).toHaveBeenCalledTimes(2);
  });

  it("비-403 에러는 재시도 없이 즉시 throw (post 1회)", async () => {
    const get = vi.fn(async () => ({ csrfToken: "tok" }));
    const post = vi.fn(async () => {
      throw httpError(401);
    });
    const api = createAuthApi(mockHttp(get as never, post as never));

    await expect(api.signOut()).rejects.toMatchObject({ statusCode: 401 });
    expect(post).toHaveBeenCalledTimes(1);
  });
});
