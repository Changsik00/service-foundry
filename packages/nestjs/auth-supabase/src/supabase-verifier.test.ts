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

beforeEach(() => {
  vi.clearAllMocks();
});

describe("SupabaseVerifier", () => {
  it("claim(top-level) + provision 포트 없음 → 검증 불가라 fail-close(orgId null) (spec-26-04 S3)", async () => {
    const token = await makeToken({
      sub: "supabase-uid-123",
      email: "user@example.com",
      role: "authenticated",
      [ACTIVE_ORG_CLAIM]: "org-abc",
    });
    const verifier = makeVerifier();
    const result = await verifier.verify(token);
    // 포트 미배선 시 클레임을 신뢰하지 않는다(silent fail-OPEN 방지).
    expect(result).toEqual({
      sub: "supabase-uid-123",
      role: "user",
      orgId: null,
      orgRole: null,
    });
  });

  it("claim(app_metadata) + 멤버 검증 통과 → orgId 채택", async () => {
    const token = await makeToken({
      sub: "supabase-uid-456",
      email: "user2@example.com",
      role: "authenticated",
      app_metadata: { [ACTIVE_ORG_CLAIM]: "org-meta" },
    });
    const mockProvision: SupabaseProvisionPort = {
      provisionFromProvider: vi.fn(),
      getOrgMembership: vi.fn().mockResolvedValue({ orgRole: "member" }),
    };
    const result = await makeVerifier(mockProvision).verify(token);
    expect(mockProvision.getOrgMembership).toHaveBeenCalledWith("supabase-uid-456", "org-meta");
    expect(result).toEqual({
      sub: "supabase-uid-456",
      role: "user",
      orgId: "org-meta",
      orgRole: "member",
    });
  });

  it("유효 token + orgId 없음 + provisionPort 없음 → orgId: null", async () => {
    const token = await makeToken({
      sub: "supabase-uid-789",
      email: "new@example.com",
    });
    const verifier = makeVerifier();
    const result = await verifier.verify(token);
    expect(result).toEqual({ sub: "supabase-uid-789", role: "user", orgId: null, orgRole: null });
  });

  it("유효 token + orgId 없음 + provisionPort 있음 → provisionFromProvider 호출", async () => {
    const token = await makeToken({
      sub: "supabase-uid-new",
      email: "newuser@example.com",
    });
    const mockProvision: SupabaseProvisionPort = {
      provisionFromProvider: vi.fn().mockResolvedValue({ orgId: "org-new", orgRole: "owner" }),
      getOrgMembership: vi.fn().mockResolvedValue(null),
    };
    const verifier = makeVerifier(mockProvision);
    const result = await verifier.verify(token);
    expect(mockProvision.provisionFromProvider).toHaveBeenCalledWith(
      "supabase-uid-new",
      "newuser@example.com",
    );
    expect(result).toEqual({
      sub: "supabase-uid-new",
      role: "user",
      orgId: "org-new",
      orgRole: "owner",
    });
  });

  it("claim orgId + provision + 멤버 → orgId 채택 + orgRole 채움 (spec-26-04)", async () => {
    const token = await makeToken({
      sub: "uid-member",
      email: "m@example.com",
      role: "authenticated",
      [ACTIVE_ORG_CLAIM]: "org-member",
    });
    const mockProvision: SupabaseProvisionPort = {
      provisionFromProvider: vi.fn(),
      getOrgMembership: vi.fn().mockResolvedValue({ orgRole: "admin" }),
    };
    const result = await makeVerifier(mockProvision).verify(token);
    expect(mockProvision.getOrgMembership).toHaveBeenCalledWith("uid-member", "org-member");
    expect(result).toEqual({
      sub: "uid-member",
      role: "user",
      orgId: "org-member",
      orgRole: "admin",
    });
  });

  it("claim orgId + provision + 비멤버 → fail-close(orgId/orgRole null) (spec-26-04)", async () => {
    const token = await makeToken({
      sub: "uid-attacker",
      email: "a@example.com",
      role: "authenticated",
      [ACTIVE_ORG_CLAIM]: "org-not-mine",
    });
    const mockProvision: SupabaseProvisionPort = {
      provisionFromProvider: vi.fn(),
      getOrgMembership: vi.fn().mockResolvedValue(null),
    };
    const result = await makeVerifier(mockProvision).verify(token);
    expect(result).toEqual({
      sub: "uid-attacker",
      role: "user",
      orgId: null,
      orgRole: null,
    });
  });

  it("무효 token (잘못된 서명) → UnauthorizedException", async () => {
    const token = await makeToken({ sub: "uid-123" }, "wrong-secret");
    const verifier = makeVerifier();
    await expect(verifier.verify(token)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
