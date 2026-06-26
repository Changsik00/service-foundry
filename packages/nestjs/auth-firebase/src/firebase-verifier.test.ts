import { UnauthorizedException } from "@nestjs/common";
import { ACTIVE_ORG_CLAIM } from "@repo/backend-auth-jwt";
import type { App } from "firebase-admin/app";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FirebaseProvisionPort } from "./firebase-provision-port.js";
import { FirebaseVerifier } from "./firebase-verifier.js";

// firebase-admin/auth 전체 모킹
const mockVerifyIdToken = vi.fn();
const mockSetCustomUserClaims = vi.fn();

vi.mock("firebase-admin/auth", () => ({
  getAuth: () => ({
    verifyIdToken: mockVerifyIdToken,
    setCustomUserClaims: mockSetCustomUserClaims,
  }),
}));

const FAKE_APP = {} as App;

function makeVerifier(provision?: FirebaseProvisionPort) {
  return new FirebaseVerifier(FAKE_APP, provision ?? null);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("FirebaseVerifier", () => {
  it("claim + provision 포트 없음 → 검증 불가라 fail-close(orgId null) (spec-26-04 S3)", async () => {
    mockVerifyIdToken.mockResolvedValue({
      uid: "firebase-uid-123",
      email: "user@example.com",
      role: "user",
      [ACTIVE_ORG_CLAIM]: "org-abc",
    });
    const verifier = makeVerifier();
    const result = await verifier.verify("valid-token");
    // 포트 미배선 시 클레임 불신(silent fail-OPEN 방지).
    expect(result).toEqual({
      sub: "firebase-uid-123",
      role: "user",
      orgId: null,
      orgRole: null,
    });
    expect(mockSetCustomUserClaims).not.toHaveBeenCalled();
  });

  it("유효 token + activeOrgId 없음 + provisionPort 없음 → orgId: null", async () => {
    mockVerifyIdToken.mockResolvedValue({
      uid: "firebase-uid-456",
      email: "new@example.com",
    });
    const verifier = makeVerifier();
    const result = await verifier.verify("valid-token");
    expect(result).toEqual({ sub: "firebase-uid-456", role: "user", orgId: null, orgRole: null });
    expect(mockSetCustomUserClaims).not.toHaveBeenCalled();
  });

  it("유효 token + activeOrgId 없음 + provisionPort 있음 → provisionFromProvider + setCustomUserClaims 호출 + sub=internalUserId", async () => {
    mockVerifyIdToken.mockResolvedValue({
      uid: "firebase-uid-789",
      email: "new-user@example.com",
    });
    mockSetCustomUserClaims.mockResolvedValue(undefined);

    const mockProvision: FirebaseProvisionPort = {
      provisionFromProvider: vi.fn().mockResolvedValue({
        orgId: "org-new",
        orgRole: "owner",
        internalUserId: "internal-uuid-789",
      }),
      getOrgMembership: vi.fn().mockResolvedValue(null),
      resolveInternalUserId: vi.fn().mockResolvedValue(null),
    };

    const verifier = makeVerifier(mockProvision);
    const result = await verifier.verify("valid-token");

    expect(mockProvision.provisionFromProvider).toHaveBeenCalledWith(
      "firebase-uid-789",
      "new-user@example.com",
    );
    expect(mockSetCustomUserClaims).toHaveBeenCalledWith("firebase-uid-789", {
      [ACTIVE_ORG_CLAIM]: "org-new",
      org_role: "owner",
    });
    // sub는 Firebase UID가 아닌 internalUserId (internal UUID)
    expect(result).toEqual({
      sub: "internal-uuid-789",
      role: "user",
      orgId: "org-new",
      orgRole: "owner",
    });
  });

  it("role 클레임 없음 → role: 'user' 기본값", async () => {
    mockVerifyIdToken.mockResolvedValue({
      uid: "firebase-uid-no-role",
      email: "norole@example.com",
      [ACTIVE_ORG_CLAIM]: "org-xyz",
    });
    const verifier = makeVerifier();
    const result = await verifier.verify("valid-token");
    expect(result.role).toBe("user");
  });

  it("claim orgId + provision + 멤버 → orgId 채택 + orgRole 채움 (spec-26-04)", async () => {
    mockVerifyIdToken.mockResolvedValue({
      uid: "fb-member",
      email: "m@example.com",
      role: "user",
      [ACTIVE_ORG_CLAIM]: "org-member",
    });
    const mockProvision: FirebaseProvisionPort = {
      provisionFromProvider: vi.fn(),
      getOrgMembership: vi.fn().mockResolvedValue({ orgRole: "admin", internalUserId: "int-fb" }),
      resolveInternalUserId: vi.fn().mockResolvedValue(null),
    };
    const result = await makeVerifier(mockProvision).verify("valid-token");
    expect(mockProvision.getOrgMembership).toHaveBeenCalledWith("fb-member", "org-member");
    expect(result.orgId).toBe("org-member");
    expect(result.orgRole).toBe("admin");
    expect(result.sub).toBe("int-fb"); // sub 정규화(spec-x-auth-sub-normalize)
    expect(mockProvision.provisionFromProvider).not.toHaveBeenCalled();
  });

  it("claim orgId + provision + 비멤버 → fail-close(orgId/orgRole null) (spec-26-04)", async () => {
    mockVerifyIdToken.mockResolvedValue({
      uid: "fb-attacker",
      email: "a@example.com",
      role: "user",
      [ACTIVE_ORG_CLAIM]: "org-not-mine",
    });
    const mockProvision: FirebaseProvisionPort = {
      provisionFromProvider: vi.fn(),
      getOrgMembership: vi.fn().mockResolvedValue(null),
      resolveInternalUserId: vi.fn().mockResolvedValue("int-fb-x"),
    };
    const result = await makeVerifier(mockProvision).verify("valid-token");
    expect(result.orgId).toBeNull();
    expect(result.orgRole).toBeNull();
    expect(result.sub).toBe("int-fb-x"); // 비멤버도 sub 정규화
  });

  it("무효 token (verifyIdToken throw) → UnauthorizedException", async () => {
    mockVerifyIdToken.mockRejectedValue(new Error("Token expired"));
    const verifier = makeVerifier();
    await expect(verifier.verify("invalid-token")).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
