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
  it("유효 token + activeOrgId 클레임 → VerifiedIdentity 반환", async () => {
    mockVerifyIdToken.mockResolvedValue({
      uid: "firebase-uid-123",
      email: "user@example.com",
      role: "user",
      [ACTIVE_ORG_CLAIM]: "org-abc",
    });
    const verifier = makeVerifier();
    const result = await verifier.verify("valid-token");
    expect(result).toEqual({ sub: "firebase-uid-123", role: "user", orgId: "org-abc" });
    expect(mockSetCustomUserClaims).not.toHaveBeenCalled();
  });

  it("유효 token + activeOrgId 없음 + provisionPort 없음 → orgId: null", async () => {
    mockVerifyIdToken.mockResolvedValue({
      uid: "firebase-uid-456",
      email: "new@example.com",
    });
    const verifier = makeVerifier();
    const result = await verifier.verify("valid-token");
    expect(result).toEqual({ sub: "firebase-uid-456", role: "user", orgId: null });
    expect(mockSetCustomUserClaims).not.toHaveBeenCalled();
  });

  it("유효 token + activeOrgId 없음 + provisionPort 있음 → provisionFromProvider + setCustomUserClaims 호출", async () => {
    mockVerifyIdToken.mockResolvedValue({
      uid: "firebase-uid-789",
      email: "new-user@example.com",
    });
    mockSetCustomUserClaims.mockResolvedValue(undefined);

    const mockProvision: FirebaseProvisionPort = {
      provisionFromProvider: vi.fn().mockResolvedValue({ orgId: "org-new", orgRole: "owner" }),
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
    expect(result).toEqual({ sub: "firebase-uid-789", role: "user", orgId: "org-new" });
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

  it("무효 token (verifyIdToken throw) → UnauthorizedException", async () => {
    mockVerifyIdToken.mockRejectedValue(new Error("Token expired"));
    const verifier = makeVerifier();
    await expect(verifier.verify("invalid-token")).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
