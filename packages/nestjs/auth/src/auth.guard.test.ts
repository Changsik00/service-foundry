import { randomUUID } from "node:crypto";

import { UnauthorizedException } from "@nestjs/common";
import { createFakeKeyStore, type KeyMaterial } from "@repo/backend-auth-jwt";
import { generateKeyPair, SignJWT } from "jose";
import { beforeAll, describe, expect, it } from "vitest";

import { AuthGuard, NESTJS_AUTH_OPTIONS, type NestjsAuthOptions } from "./auth.guard.js";

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

function makeCtx(authHeader?: string): {
  ctx: { switchToHttp: () => { getRequest: () => Record<string, unknown> } };
  req: Record<string, unknown>;
} {
  const req: Record<string, unknown> = {
    headers: authHeader ? { authorization: authHeader } : {},
  };
  return {
    ctx: { switchToHttp: () => ({ getRequest: () => req }) },
    req,
  };
}

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

describe("AuthGuard", () => {
  it("유효 token + role → canActivate true, req.user 설정", async () => {
    const token = await signToken({ role: "user" });
    const { ctx, req } = makeCtx(`Bearer ${token}`);
    const guard = new AuthGuard(opts);
    // biome-ignore lint/suspicious/noExplicitAny: ExecutionContext mock
    const result = await guard.canActivate(ctx as any);
    expect(result).toBe(true);
    expect(req.user).toEqual({ sub: "user-123", role: "user", orgId: null });
  });

  it("만료 token → UnauthorizedException", async () => {
    const token = await signToken({ role: "user" }, -1);
    const { ctx } = makeCtx(`Bearer ${token}`);
    const guard = new AuthGuard(opts);
    // biome-ignore lint/suspicious/noExplicitAny: ExecutionContext mock
    await expect(guard.canActivate(ctx as any)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("role claim 없는 token → UnauthorizedException", async () => {
    const token = await signToken({});
    const { ctx } = makeCtx(`Bearer ${token}`);
    const guard = new AuthGuard(opts);
    // biome-ignore lint/suspicious/noExplicitAny: ExecutionContext mock
    await expect(guard.canActivate(ctx as any)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("Authorization 헤더 없음 → UnauthorizedException", async () => {
    const { ctx } = makeCtx();
    const guard = new AuthGuard(opts);
    // biome-ignore lint/suspicious/noExplicitAny: ExecutionContext mock
    await expect(guard.canActivate(ctx as any)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("NESTJS_AUTH_OPTIONS Symbol export 확인", () => {
    expect(typeof NESTJS_AUTH_OPTIONS).toBe("symbol");
  });
});
