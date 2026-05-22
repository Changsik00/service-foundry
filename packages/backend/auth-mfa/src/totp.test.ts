import { authenticator } from "otplib";
import { describe, expect, it } from "vitest";
import { generateSecret, generateTotpUri, verifyTotp } from "./totp.js";

describe("generateSecret", () => {
  it("base32 문자열 20자 이상을 반환해야 한다", () => {
    const secret = generateSecret();
    expect(typeof secret).toBe("string");
    expect(secret.length).toBeGreaterThanOrEqual(32);
    expect(/^[A-Z2-7]+=*$/.test(secret)).toBe(true);
  });

  it("호출할 때마다 다른 값을 반환해야 한다", () => {
    const a = generateSecret();
    const b = generateSecret();
    expect(a).not.toBe(b);
  });
});

describe("generateTotpUri", () => {
  it("올바른 otpauth URI 형식을 반환해야 한다", () => {
    const secret = generateSecret();
    const uri = generateTotpUri(secret, "user@example.com", "MyApp");
    expect(uri).toMatch(/^otpauth:\/\/totp\//);
    expect(uri).toContain("secret=");
    expect(uri).toContain("issuer=MyApp");
  });
});

describe("verifyTotp", () => {
  it("현재 유효한 코드는 true를 반환해야 한다", () => {
    const secret = generateSecret();
    const validCode = authenticator.generate(secret);
    expect(verifyTotp(secret, validCode)).toBe(true);
  });

  it("잘못된 코드는 false를 반환해야 한다", () => {
    const secret = generateSecret();
    expect(verifyTotp(secret, "000000")).toBe(false);
  });

  it("빈 코드는 false를 반환해야 한다", () => {
    const secret = generateSecret();
    expect(verifyTotp(secret, "")).toBe(false);
  });
});
