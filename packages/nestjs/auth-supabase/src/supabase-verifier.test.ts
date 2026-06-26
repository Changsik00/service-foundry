import { UnauthorizedException } from "@nestjs/common";
import { ACTIVE_ORG_CLAIM } from "@repo/backend-auth-jwt";
import { SignJWT } from "jose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseProvisionPort } from "./supabase-provision-port.js";
import { SupabaseVerifier } from "./supabase-verifier.js";

const JWT_SECRET = "test-supabase-jwt-secret-for-unit-tests";

async function makeToken(payload: Record<string, unknown>, secret = JWT_SECRET): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(secret));
}

function makeVerifier(provision?: SupabaseProvisionPort) {
  return new SupabaseVerifier({ jwtSecret: JWT_SECRET }, provision ?? null);
}

/** 완전한 SupabaseProvisionPort mock — 개별 메서드만 덮어쓴다. */
function makeProvision(over: Partial<SupabaseProvisionPort> = {}): SupabaseProvisionPort {
  return {
    provisionFromProvider: vi.fn(),
    getOrgMembership: vi.fn(),
    resolveInternalUserId: vi.fn().mockResolvedValue(null),
    ...over,
  } as SupabaseProvisionPort;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("SupabaseVerifier — sub 정규화 (spec-x-auth-sub-normalize)", () => {
  it("claim + provision 없음 → fail-close + sub=providerUid 폴백(해석 수단 없음)", async () => {
    const token = await makeToken({
      sub: "supabase-uid-123",
      email: "user@example.com",
      role: "authenticated",
      [ACTIVE_ORG_CLAIM]: "org-abc",
    });
    const result = await makeVerifier().verify(token);
    expect(result).toEqual({ sub: "supabase-uid-123", role: "user", orgId: null, orgRole: null });
  });

  it("orgId 없음 + provision → provisionFromProvider, sub=internalUserId", async () => {
    const token = await makeToken({ sub: "uid-new", email: "n@example.com" });
    const provision = makeProvision({
      provisionFromProvider: vi
        .fn()
        .mockResolvedValue({ orgId: "org-new", orgRole: "owner", internalUserId: "int-new" }),
    });
    const result = await makeVerifier(provision).verify(token);
    expect(provision.provisionFromProvider).toHaveBeenCalledWith("uid-new", "n@example.com");
    expect(result).toEqual({ sub: "int-new", role: "user", orgId: "org-new", orgRole: "owner" });
  });

  it("claim + 멤버 → sub=internalUserId + orgId/orgRole 채택", async () => {
    const token = await makeToken({
      sub: "uid-member",
      email: "m@example.com",
      [ACTIVE_ORG_CLAIM]: "org-member",
    });
    const provision = makeProvision({
      getOrgMembership: vi
        .fn()
        .mockResolvedValue({ orgRole: "admin", internalUserId: "int-member" }),
    });
    const result = await makeVerifier(provision).verify(token);
    expect(provision.getOrgMembership).toHaveBeenCalledWith("uid-member", "org-member");
    expect(result).toEqual({
      sub: "int-member",
      role: "user",
      orgId: "org-member",
      orgRole: "admin",
    });
  });

  it("claim + 비멤버 → fail-close(orgId null) + sub=resolveInternalUserId", async () => {
    const token = await makeToken({
      sub: "uid-x",
      email: "x@example.com",
      [ACTIVE_ORG_CLAIM]: "org-not-mine",
    });
    const provision = makeProvision({
      getOrgMembership: vi.fn().mockResolvedValue(null),
      resolveInternalUserId: vi.fn().mockResolvedValue("int-x"),
    });
    const result = await makeVerifier(provision).verify(token);
    expect(result).toEqual({ sub: "int-x", role: "user", orgId: null, orgRole: null });
  });

  it("무효 token (잘못된 서명) → UnauthorizedException", async () => {
    const token = await makeToken({ sub: "uid-123" }, "wrong-secret");
    await expect(makeVerifier().verify(token)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
