import { UnauthorizedException } from "@nestjs/common";
import { AppError } from "@repo/errors";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OAuthService } from "./oauth.service.js";

function makeService() {
  return new OAuthService(
    {} as never, // oauthStore (state-mismatch/url 경로에선 미접근)
    {} as never, // sessionStore
    {} as never, // jwtService
    { issuer: "http://localhost:3000", audience: "http://localhost:3000" },
  );
}

describe("OAuthService.buildAuthorizationUrl", () => {
  beforeEach(() => {
    vi.stubEnv("GOOGLE_CLIENT_ID", "google-client-123");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("google → PKCE(S256) + client_id 포함 redirectUrl + state/codeVerifier 반환", () => {
    const res = makeService().buildAuthorizationUrl("google", "http://localhost/cb");
    expect(res.redirectUrl).toContain("client_id=google-client-123");
    expect(res.redirectUrl).toContain("code_challenge_method=S256");
    expect(res.redirectUrl).toContain(`state=${res.state}`);
    expect(res.state).toBeTruthy();
    expect(res.codeVerifier).toBeTruthy();
  });

  it("미지원 provider → AppError (getProvider 검증, 전역 필터가 404 매핑)", () => {
    expect(() => makeService().buildAuthorizationUrl("unknown", "http://localhost/cb")).toThrow(
      AppError,
    );
  });
});

describe("OAuthService 자격증명 fail-fast (Wa)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("known provider 인데 client_id env 가 비면 throw (빈 문자열 진행 금지)", () => {
    vi.stubEnv("GOOGLE_CLIENT_ID", "");
    expect(() => makeService().buildAuthorizationUrl("google", "http://localhost/cb")).toThrow(
      AppError,
    );
  });

  it("known provider 인데 client_id env 가 undefined 면 throw", () => {
    vi.stubEnv("GOOGLE_CLIENT_ID", undefined as unknown as string);
    expect(() => makeService().buildAuthorizationUrl("google", "http://localhost/cb")).toThrow(
      AppError,
    );
  });
});

describe("OAuthService.handleCallback", () => {
  it("state 불일치 → UnauthorizedException (네트워크 도달 전 거부)", async () => {
    await expect(
      makeService().handleCallback(
        "google",
        "code",
        "state-param",
        "different-cookie-state",
        "verifier",
        "http://localhost/cb",
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
