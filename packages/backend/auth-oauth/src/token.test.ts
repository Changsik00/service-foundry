import { MockAgent, setGlobalDispatcher } from "undici";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { googleProvider, kakaoProvider } from "./providers.js";
import { exchangeCode, fetchUserInfo } from "./token.js";

let agent: MockAgent;

beforeEach(() => {
  agent = new MockAgent();
  agent.disableNetConnect();
  setGlobalDispatcher(agent);
});

afterEach(() => {
  agent.close();
});

describe("exchangeCode — Google", () => {
  it("code + verifier로 access_token을 반환해야 한다", async () => {
    const pool = agent.get("https://oauth2.googleapis.com");
    pool.intercept({ path: "/token", method: "POST" }).reply(200, {
      access_token: "google-access-token",
      token_type: "Bearer",
      expires_in: 3600,
    });

    const tokens = await exchangeCode(googleProvider, {
      code: "auth-code",
      codeVerifier: "verifier",
      redirectUri: "http://localhost:3000/auth/oauth/google/callback",
      clientId: "client-id",
      clientSecret: "client-secret",
    });

    expect(tokens.accessToken).toBe("google-access-token");
  });

  it("provider 오류 응답 시 에러를 던져야 한다", async () => {
    const pool = agent.get("https://oauth2.googleapis.com");
    pool.intercept({ path: "/token", method: "POST" }).reply(400, {
      error: "invalid_grant",
    });

    await expect(
      exchangeCode(googleProvider, {
        code: "bad-code",
        codeVerifier: "verifier",
        redirectUri: "http://localhost:3000/auth/oauth/google/callback",
        clientId: "client-id",
        clientSecret: "client-secret",
      }),
    ).rejects.toThrow();
  });
});

describe("fetchUserInfo — Google", () => {
  it("access_token으로 sub + email을 반환해야 한다", async () => {
    const pool = agent.get("https://www.googleapis.com");
    pool
      .intercept({ path: "/oauth2/v3/userinfo", method: "GET" })
      .reply(200, { sub: "google-sub-123", email: "user@example.com", name: "Test User" });

    const info = await fetchUserInfo(googleProvider, "google-access-token");

    expect(info.providerAccountId).toBe("google-sub-123");
    expect(info.email).toBe("user@example.com");
  });
});

describe("fetchUserInfo — Kakao", () => {
  it("kakao_account.email과 id를 반환해야 한다", async () => {
    const pool = agent.get("https://kapi.kakao.com");
    pool.intercept({ path: "/v2/user/me", method: "GET" }).reply(200, {
      id: 999888777,
      kakao_account: { email: "kakao@example.com" },
    });

    const info = await fetchUserInfo(kakaoProvider, "kakao-access-token");

    expect(info.providerAccountId).toBe("999888777");
    expect(info.email).toBe("kakao@example.com");
  });
});
