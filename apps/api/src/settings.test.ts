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
    });
    expect(settings.NODE_ENV).toBe("production");
  });

  it("development 는 dev 기본값 허용 (가드는 production 한정)", () => {
    const settings = loadSettings({ ...baseEnv, NODE_ENV: "development" });
    expect(settings.CSRF_SECRET).toBe("dev-secret-change-in-production");
  });
});
