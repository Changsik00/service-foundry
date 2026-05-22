import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import { generateCodeChallenge, generateCodeVerifier } from "./pkce.js";

describe("generateCodeVerifier", () => {
  it("길이가 43-128자 사이여야 한다", () => {
    const verifier = generateCodeVerifier();
    expect(verifier.length).toBeGreaterThanOrEqual(43);
    expect(verifier.length).toBeLessThanOrEqual(128);
  });

  it("base64url 문자만 포함해야 한다 (패딩 = 없음)", () => {
    const verifier = generateCodeVerifier();
    expect(verifier).toMatch(/^[A-Za-z0-9\-_]+$/);
  });

  it("매 호출마다 다른 값을 반환해야 한다", () => {
    const v1 = generateCodeVerifier();
    const v2 = generateCodeVerifier();
    expect(v1).not.toBe(v2);
  });
});

describe("generateCodeChallenge", () => {
  it("verifier의 SHA-256 해시를 base64url로 반환해야 한다", () => {
    const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
    const expected = createHash("sha256").update(verifier).digest("base64url");
    expect(generateCodeChallenge(verifier)).toBe(expected);
  });

  it("패딩(=) 없는 base64url 형식이어야 한다", () => {
    const challenge = generateCodeChallenge(generateCodeVerifier());
    expect(challenge).not.toContain("=");
    expect(challenge).toMatch(/^[A-Za-z0-9\-_]+$/);
  });
});
