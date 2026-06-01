import { isAppError } from "@repo/errors";
import { isErr, isOk } from "@repo/utils";
import { describe, expect, it } from "vitest";

import { createInMemoryKeyStore } from "./memory-store.js";
import { signAccessToken } from "./sign.js";
import { JwtErrorCode, verifyAccessToken } from "./verify.js";

const ISS = "https://auth.example.test";
const AUD = "service-foundry.api";

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

describe("verifyAccessToken", () => {
  it("round-trip: sign → verify returns Result.ok with claims", async () => {
    const store = await createInMemoryKeyStore();
    const token = await signAccessToken({ sub: "user-42" }, store, {
      issuer: ISS,
      audience: AUD,
      jti: "explicit-jti-1",
    });
    const result = await verifyAccessToken(token, store, { issuer: ISS, audience: AUD });
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) throw new Error("unreachable");
    expect(result.value.sub).toBe("user-42");
    expect(result.value.iss).toBe(ISS);
    expect(result.value.aud).toBe(AUD);
    expect(result.value.jti).toBe("explicit-jti-1");
    expect(result.value.iat).toBeGreaterThan(0);
    expect(result.value.exp).toBeGreaterThan(result.value.iat);
  });

  it("verified result preserves custom claims (role) from signed payload", async () => {
    const store = await createInMemoryKeyStore();
    const token = await signAccessToken({ sub: "user-42", role: "admin" }, store, {
      issuer: ISS,
      audience: AUD,
    });
    const result = await verifyAccessToken(token, store, { issuer: ISS, audience: AUD });
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) throw new Error("unreachable");
    // 커스텀 claim 은 검증된 result.value 에서 읽을 수 있어야 한다 (decodeJwt 우회 불필요).
    expect(result.value.role).toBe("admin");
  });

  it("returns TOKEN_EXPIRED when exp is past", async () => {
    const store = await createInMemoryKeyStore();
    const token = await signAccessToken({ sub: "user-42" }, store, {
      issuer: ISS,
      audience: AUD,
      expiresIn: "1s",
    });
    await sleep(1500);
    const result = await verifyAccessToken(token, store, { issuer: ISS, audience: AUD });
    expect(isErr(result)).toBe(true);
    if (!isErr(result)) throw new Error("unreachable");
    expect(isAppError(result.error)).toBe(true);
    expect(result.error.code).toBe(JwtErrorCode.TOKEN_EXPIRED);
    expect(result.error.statusCode).toBe(401);
  });

  it("returns TOKEN_INVALID for signature tampering", async () => {
    const store = await createInMemoryKeyStore();
    const token = await signAccessToken({ sub: "user-42" }, store, { issuer: ISS, audience: AUD });
    const [h, p] = token.split(".");
    const tampered = `${h}.${p}.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA`;
    const result = await verifyAccessToken(tampered, store, { issuer: ISS, audience: AUD });
    expect(isErr(result)).toBe(true);
    if (!isErr(result)) throw new Error("unreachable");
    expect(result.error.code).toBe(JwtErrorCode.TOKEN_INVALID);
  });

  it("returns TOKEN_INVALID for malformed token", async () => {
    const store = await createInMemoryKeyStore();
    const result = await verifyAccessToken("not.a.valid.jwt", store, {
      issuer: ISS,
      audience: AUD,
    });
    expect(isErr(result)).toBe(true);
    if (!isErr(result)) throw new Error("unreachable");
    expect(result.error.code).toBe(JwtErrorCode.TOKEN_INVALID);
  });

  it("returns TOKEN_CLAIM_MISMATCH for iss mismatch", async () => {
    const store = await createInMemoryKeyStore();
    const token = await signAccessToken({ sub: "user-42" }, store, { issuer: ISS, audience: AUD });
    const result = await verifyAccessToken(token, store, {
      issuer: "https://other.example.test",
      audience: AUD,
    });
    expect(isErr(result)).toBe(true);
    if (!isErr(result)) throw new Error("unreachable");
    expect(result.error.code).toBe(JwtErrorCode.TOKEN_CLAIM_MISMATCH);
  });

  it("returns TOKEN_CLAIM_MISMATCH for aud mismatch", async () => {
    const store = await createInMemoryKeyStore();
    const token = await signAccessToken({ sub: "user-42" }, store, { issuer: ISS, audience: AUD });
    const result = await verifyAccessToken(token, store, {
      issuer: ISS,
      audience: "other-service",
    });
    expect(isErr(result)).toBe(true);
    if (!isErr(result)) throw new Error("unreachable");
    expect(result.error.code).toBe(JwtErrorCode.TOKEN_CLAIM_MISMATCH);
  });

  it("returns TOKEN_KEY_NOT_FOUND when kid is unknown in verifying store", async () => {
    const signerStore = await createInMemoryKeyStore({ kid: "signer-kid" });
    const verifierStore = await createInMemoryKeyStore({ kid: "verifier-kid" });
    const token = await signAccessToken({ sub: "user-42" }, signerStore, {
      issuer: ISS,
      audience: AUD,
    });
    const result = await verifyAccessToken(token, verifierStore, {
      issuer: ISS,
      audience: AUD,
    });
    expect(isErr(result)).toBe(true);
    if (!isErr(result)) throw new Error("unreachable");
    expect(result.error.code).toBe(JwtErrorCode.TOKEN_KEY_NOT_FOUND);
  });
});
