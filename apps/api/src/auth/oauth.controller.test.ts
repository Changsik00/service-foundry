import type { Request, Response } from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OAuthController } from "./oauth.controller.js";

function makeService() {
  return {
    buildAuthorizationUrl: vi.fn().mockReturnValue({
      redirectUrl: "https://provider.example/authorize?x=1",
      state: "state-1",
      codeVerifier: "verifier-1",
    }),
    handleCallback: vi.fn().mockResolvedValue({
      accessToken: "at-1",
      refreshToken: "rt-1",
      userId: "user-001",
    }),
  };
}

function makeRes() {
  return { cookie: vi.fn(), clearCookie: vi.fn() } as unknown as Response;
}

const BASE = "https://app.test";
const EXPECTED_REDIRECT = `${BASE}/auth/oauth/google/callback`;
let prevBase: string | undefined;

describe("OAuthController", () => {
  let service: ReturnType<typeof makeService>;
  let controller: OAuthController;

  beforeEach(() => {
    prevBase = process.env["OAUTH_REDIRECT_BASE_URL"];
    process.env["OAUTH_REDIRECT_BASE_URL"] = BASE;
    service = makeService();
    controller = new OAuthController(service as never);
  });

  afterEach(() => {
    if (prevBase === undefined) delete process.env["OAUTH_REDIRECT_BASE_URL"];
    else process.env["OAUTH_REDIRECT_BASE_URL"] = prevBase;
  });

  it("authorize → buildAuthorizationUrl(provider, redirectUri) 위임 + 302 리다이렉트 + state/pkce 쿠키", () => {
    const res = makeRes();
    const req = { cookies: {} } as unknown as Request;
    const result = controller.authorize("google", res, req);
    expect(service.buildAuthorizationUrl).toHaveBeenCalledWith("google", EXPECTED_REDIRECT);
    expect(res.cookie).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ url: "https://provider.example/authorize?x=1", statusCode: 302 });
  });

  it("callback → 쿠키의 state/verifier 로 handleCallback 위임 + 임시 쿠키 정리 + refresh 쿠키 설정", async () => {
    const res = makeRes();
    const req = {
      cookies: { oauth_state: "state-1", oauth_pkce: "verifier-1" },
    } as unknown as Request;
    const result = await controller.callback("google", "auth-code", "state-1", req, res);
    expect(service.handleCallback).toHaveBeenCalledWith(
      "google",
      "auth-code",
      "state-1",
      "state-1",
      "verifier-1",
      EXPECTED_REDIRECT,
    );
    expect(res.clearCookie).toHaveBeenCalledTimes(2);
    expect(res.cookie).toHaveBeenCalled();
    expect(result).toEqual({ accessToken: "at-1", userId: "user-001" });
  });

  it("callback → 쿠키 없으면 빈 문자열로 위임", async () => {
    const res = makeRes();
    const req = { cookies: {} } as unknown as Request;
    await controller.callback("google", "auth-code", "state-1", req, res);
    expect(service.handleCallback).toHaveBeenCalledWith(
      "google",
      "auth-code",
      "state-1",
      "",
      "",
      EXPECTED_REDIRECT,
    );
  });
});
