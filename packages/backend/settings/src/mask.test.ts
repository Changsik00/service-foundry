import { describe, expect, it } from "vitest";
import { MASK, maskConfig } from "./mask.js";

const sample = {
  NODE_ENV: "development",
  PORT: 2026,
  DATABASE_URL: "postgres://postgres:supersecret@localhost:5432/db",
  OAUTH_STATE_SECRET: "very-secret-value",
  GOOGLE_CLIENT_SECRET: "google-secret",
  JWT_ISSUER: "http://localhost:3000",
  PASSKEY_RP_ID: "localhost",
};

describe("maskConfig", () => {
  it("시크릿 키는 마스킹된다", () => {
    const out = maskConfig(sample);
    expect(out.DATABASE_URL).toBe(MASK);
    expect(out.OAUTH_STATE_SECRET).toBe(MASK);
    expect(out.GOOGLE_CLIENT_SECRET).toBe(MASK);
  });

  it("비밀이 아닌 키는 그대로 노출된다", () => {
    const out = maskConfig(sample);
    expect(out.NODE_ENV).toBe("development");
    expect(out.PORT).toBe(2026);
    expect(out.JWT_ISSUER).toBe("http://localhost:3000");
    expect(out.PASSKEY_RP_ID).toBe("localhost"); // 'key' 부분일치로 오마스킹 금지
  });

  it("출력 어디에도 시크릿 평문이 남지 않는다", () => {
    const dump = JSON.stringify(maskConfig(sample));
    expect(dump).not.toContain("supersecret");
    expect(dump).not.toContain("very-secret-value");
    expect(dump).not.toContain("google-secret");
  });

  it("원본 객체를 변형하지 않는다 (순수)", () => {
    const copy = { ...sample };
    maskConfig(sample);
    expect(sample).toEqual(copy);
  });

  it("추가 redact 키를 옵션으로 지정할 수 있다", () => {
    const out = maskConfig({ CUSTOM_FOO: "x" }, { redactSubstrings: ["foo"] });
    expect(out.CUSTOM_FOO).toBe(MASK);
  });
});
