import { decodeJwt, decodeProtectedHeader } from "jose";
import { describe, expect, it } from "vitest";

import { createInMemoryKeyStore } from "./memory-store.js";
import { signAccessToken } from "./sign.js";

const ISS = "https://auth.example.test";
const AUD = "service-foundry.api";

describe("signAccessToken", () => {
  it("produces a JWT with EdDSA header + kid", async () => {
    const store = await createInMemoryKeyStore({ kid: "k-test" });
    const token = await signAccessToken({ sub: "user-42" }, store, { issuer: ISS, audience: AUD });
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);

    const header = decodeProtectedHeader(token);
    expect(header.alg).toBe("EdDSA");
    expect(header.kid).toBe("k-test");
    expect(header.typ).toBe("JWT");
  });

  it("includes sub / iss / aud / iat / exp / jti claims", async () => {
    const store = await createInMemoryKeyStore();
    const before = Math.floor(Date.now() / 1000);
    const token = await signAccessToken({ sub: "user-42" }, store, { issuer: ISS, audience: AUD });
    const after = Math.ceil(Date.now() / 1000);

    const claims = decodeJwt(token);
    expect(claims.sub).toBe("user-42");
    expect(claims.iss).toBe(ISS);
    expect(claims.aud).toBe(AUD);
    expect(typeof claims.jti).toBe("string");
    expect(claims.jti).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(claims.iat).toBeGreaterThanOrEqual(before);
    expect(claims.iat).toBeLessThanOrEqual(after);
    // 기본 TTL 15분
    expect(claims.exp).toBeGreaterThan((claims.iat ?? 0) + 14 * 60);
    expect(claims.exp).toBeLessThanOrEqual((claims.iat ?? 0) + 15 * 60);
  });

  it("respects explicit expiresIn (1h)", async () => {
    const store = await createInMemoryKeyStore();
    const token = await signAccessToken({ sub: "user-42" }, store, {
      issuer: ISS,
      audience: AUD,
      expiresIn: "1h",
    });
    const claims = decodeJwt(token);
    expect(claims.exp).toBeGreaterThan((claims.iat ?? 0) + 59 * 60);
    expect(claims.exp).toBeLessThanOrEqual((claims.iat ?? 0) + 60 * 60);
  });

  it("respects explicit jti", async () => {
    const store = await createInMemoryKeyStore();
    const token = await signAccessToken({ sub: "user-42" }, store, {
      issuer: ISS,
      audience: AUD,
      jti: "explicit-jti-1",
    });
    expect(decodeJwt(token).jti).toBe("explicit-jti-1");
  });

  it("rejects empty sub", async () => {
    const store = await createInMemoryKeyStore();
    await expect(
      signAccessToken({ sub: "" }, store, { issuer: ISS, audience: AUD }),
    ).rejects.toThrow(/sub/i);
  });
});
