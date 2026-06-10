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
  it("유효 token + activeOrgId 클레임 (top-level) → VerifiedIdentity 반환", async () => {
    const token = await makeToken({
      sub: "supabase-uid-123",
      email: "user@example.com",
      role: "authenticated",
      [ACTIVE_ORG_CLAIM]: "org-abc",
    });
    const verifier = makeVerifier();
    const result = await verifier.verify(token);
    expect(result).toEqual({ sub: "supabase-uid-123", role: "authenticated", orgId: "org-abc" });
  });

  it("유효 token + app_metadata.activeOrgId → orgId 추출", async () => {
    const token = await makeToken({
      sub: "supabase-uid-456",
      email: "user2@example.com",
      role: "authenticated",
      app_metadata: { [ACTIVE_ORG_CLAIM]: "org-meta" },
    });
    const verifier = makeVerifier();
    const result = await verifier.verify(token);
    expect(result).toEqual({ sub: "supabase-uid-456", role: "authenticated", orgId: "org-meta" });
  });

  it("유효 token + orgId 없음 + provisionPort 없음 → orgId: null", async () => {
    const token = await makeToken({
      sub: "supabase-uid-789",
      email: "new@example.com",
    });
    const verifier = makeVerifier();
    const result = await verifier.verify(token);
    expect(result).toEqual({ sub: "supabase-uid-789", role: "user", orgId: null });
  });

  it("유효 token + orgId 없음 + provisionPort 있음 → provisionFromProvider 호출", async () => {
    const token = await makeToken({
      sub: "supabase-uid-new",
      email: "newuser@example.com",
    });
    const mockProvision: SupabaseProvisionPort = {
      provisionFromProvider: vi.fn().mockResolvedValue({ orgId: "org-new", orgRole: "owner" }),
    };
    const verifier = makeVerifier(mockProvision);
    const result = await verifier.verify(token);
    expect(mockProvision.provisionFromProvider).toHaveBeenCalledWith(
      "supabase-uid-new",
      "newuser@example.com",
    );
    expect(result).toEqual({ sub: "supabase-uid-new", role: "user", orgId: "org-new" });
  });

  it("무효 token (잘못된 서명) → UnauthorizedException", async () => {
    const token = await makeToken({ sub: "uid-123" }, "wrong-secret");
    const verifier = makeVerifier();
    await expect(verifier.verify(token)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
