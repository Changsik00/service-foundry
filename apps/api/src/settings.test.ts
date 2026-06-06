import { describe, expect, it } from "vitest";
import { loadSettings } from "./settings.js";

const baseEnv = {
  DATABASE_URL: "postgres://postgres:test@localhost:5432/test",
  HTTP_CLIENT_BASE_URL: "http://localhost:9999",
};

describe("loadSettings — production 시크릿 가드 (spec-16-02 phase-FF W3)", () => {
  it("production + CSRF_SECRET 가 dev 기본값이면 기동 거부", () => {
    expect(() => loadSettings({ ...baseEnv, NODE_ENV: "production" })).toThrow(/CSRF_SECRET/);
  });

  it("production + OAUTH_STATE_SECRET 가 dev 기본값이면 기동 거부", () => {
    expect(() =>
      loadSettings({
        ...baseEnv,
        NODE_ENV: "production",
        CSRF_SECRET: "strong-csrf-secret-value-xyz",
      }),
    ).toThrow(/OAUTH_STATE_SECRET/);
  });

  it("production + 강한 시크릿이면 통과", () => {
    const settings = loadSettings({
      ...baseEnv,
      NODE_ENV: "production",
      CSRF_SECRET: "strong-csrf-secret-value-xyz",
      OAUTH_STATE_SECRET: "strong-oauth-state-secret-abc",
      RESEND_API_KEY: "example-resend-api-key-test",
    });
    expect(settings.NODE_ENV).toBe("production");
  });

  it("development 는 dev 기본값 허용 (가드는 production 한정)", () => {
    const settings = loadSettings({ ...baseEnv, NODE_ENV: "development" });
    expect(settings.CSRF_SECRET).toBe("dev-secret-change-in-production");
  });
});

describe("loadSettings — RESEND_API_KEY production 가드 (spec-17-01)", () => {
  const prodSecrets = {
    CSRF_SECRET: "example-csrf-secret-xyz",
    OAUTH_STATE_SECRET: "example-oauth-state-secret",
  };
  const prodBase = { ...baseEnv, NODE_ENV: "production", ...prodSecrets };

  it("production + RESEND_API_KEY 미설정 시 기동 거부", () => {
    expect(() => loadSettings(prodBase)).toThrow(/RESEND_API_KEY/);
  });

  it("production + RESEND_API_KEY 설정 시 통과", () => {
    const settings = loadSettings({ ...prodBase, RESEND_API_KEY: "example-resend-api-key-test" });
    expect(settings.RESEND_API_KEY).toBe("example-resend-api-key-test");
  });

  it("EMAIL_FROM 기본값은 noreply@localhost", () => {
    const settings = loadSettings({ ...baseEnv, NODE_ENV: "development" });
    expect(settings.EMAIL_FROM).toBe("noreply@localhost");
  });

  it("FRONTEND_URL 기본값은 http://localhost:3000", () => {
    const settings = loadSettings({ ...baseEnv, NODE_ENV: "development" });
    expect(settings.FRONTEND_URL).toBe("http://localhost:3000");
  });

  it("development 는 RESEND_API_KEY 없어도 통과", () => {
    const settings = loadSettings({ ...baseEnv, NODE_ENV: "development" });
    expect(settings.RESEND_API_KEY).toBeUndefined();
  });
});
