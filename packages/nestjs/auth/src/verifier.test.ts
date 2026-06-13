import { randomUUID } from "node:crypto";

import { UnauthorizedException } from "@nestjs/common";
import { createFakeKeyStore, type KeyMaterial } from "@repo/backend-auth-jwt";
import { generateKeyPair, SignJWT } from "jose";
import { beforeAll, describe, expect, it } from "vitest";

import type { NestjsAuthOptions } from "./auth.guard.js";
import { NativeVerifier } from "./verifier.js";

const ISSUER = "https://api.test";
const AUDIENCE = "https://api.test";

let keyMaterial: KeyMaterial;
let opts: NestjsAuthOptions;

beforeAll(async () => {
  const { privateKey, publicKey } = await generateKeyPair("EdDSA");
  keyMaterial = { kid: "test-kid", alg: "EdDSA", privateKey, publicKey };
  const store = createFakeKeyStore({ active: keyMaterial });
  opts = { keyStore: store, issuer: ISSUER, audience: AUDIENCE };
});

async function signToken(claims: Record<string, unknown>, expiresIn: string | number = "15m") {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "EdDSA", kid: keyMaterial.kid, typ: "JWT" })
    .setSubject("user-123")
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setJti(randomUUID())
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(keyMaterial.privateKey);
}

describe("NativeVerifier", () => {
  it("유효 token + role → VerifiedIdentity 반환", async () => {
    const token = await signToken({ role: "user" });
    const verifier = new NativeVerifier(opts);
    const result = await verifier.verify(token);
    expect(result).toEqual({ sub: "user-123", role: "user", orgId: null, orgRole: null });
  });

  it("activeOrgId 클레임 → orgId 매핑", async () => {
    const token = await signToken({ role: "user", activeOrgId: "org-abc" });
    const verifier = new NativeVerifier(opts);
    const result = await verifier.verify(token);
    expect(result.orgId).toBe("org-abc");
  });

  it("구 클레임명 orgId 만 있으면 orgId=null (표류 방지)", async () => {
    const token = await signToken({ role: "user", orgId: "org-legacy" });
    const verifier = new NativeVerifier(opts);
    const result = await verifier.verify(token);
    expect(result.orgId).toBeNull();
  });

  it("만료 token → UnauthorizedException", async () => {
    const token = await signToken({ role: "user" }, -1);
    const verifier = new NativeVerifier(opts);
    await expect(verifier.verify(token)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("role 클레임 없는 token → UnauthorizedException", async () => {
    const token = await signToken({});
    const verifier = new NativeVerifier(opts);
    await expect(verifier.verify(token)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("ACCESS_TOKEN_VERIFIER Symbol export 확인", async () => {
    const { ACCESS_TOKEN_VERIFIER } = await import("./verifier.js");
    expect(typeof ACCESS_TOKEN_VERIFIER).toBe("symbol");
  });
});
