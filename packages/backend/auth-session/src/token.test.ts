import { describe, expect, it } from "vitest";

import { generateRefreshToken, hashToken } from "./token.js";

describe("generateRefreshToken", () => {
  it("최소 20자 (Token schema 충족)", () => {
    const token = generateRefreshToken();
    expect(token.length).toBeGreaterThanOrEqual(20);
  });

  it("base64url — URL-safe 문자만", () => {
    const token = generateRefreshToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("두 번 호출 시 서로 다른 token (entropy)", () => {
    expect(generateRefreshToken()).not.toBe(generateRefreshToken());
  });
});

describe("hashToken", () => {
  it("같은 token → 같은 hash (deterministic)", () => {
    expect(hashToken("abc")).toBe(hashToken("abc"));
  });

  it("다른 token → 다른 hash", () => {
    expect(hashToken("abc")).not.toBe(hashToken("def"));
  });

  it("SHA-256 hex 길이 = 64", () => {
    expect(hashToken("abc")).toHaveLength(64);
  });
});
