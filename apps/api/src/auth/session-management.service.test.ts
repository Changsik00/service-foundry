import { ForbiddenException } from "@nestjs/common";
import type { SessionStore } from "@repo/backend-auth-session";
import { hashToken } from "@repo/backend-auth-session";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SessionManagementService } from "./session-management.service.js";

function makeStore(): SessionStore {
  return {
    insert: vi.fn(),
    findByHash: vi.fn(),
    updateRevoked: vi.fn(),
    bulkRevokeByFamily: vi.fn(),
    revokeAllByUser: vi.fn(),
    findById: vi.fn(),
    findByPublicId: vi.fn(),
    listActiveByUser: vi.fn(),
    revokeOthers: vi.fn(),
  };
}

// org public_id 해석용 DATABASE mock — distinct orgId 없으면 호출 안 됨.
function makeDatabase() {
  const where = vi.fn().mockResolvedValue([]);
  const from = vi.fn().mockReturnValue({ where });
  const select = vi.fn().mockReturnValue({ from });
  return { db: { select } } as never;
}

function makeSessionRow(
  overrides: Partial<{
    id: string;
    publicId: string;
    userId: string;
    refreshTokenHash: string;
    orgId: string | null;
  }> = {},
) {
  return {
    id: "sess-1",
    publicId: "ses_AAAAAAAAAAAAAAAAAAAAAA0001",
    userId: "user-1",
    refreshTokenHash: "hash-abc",
    refreshTokenFamily: "family-1",
    orgId: null,
    revokedAt: null,
    expiresAt: new Date(Date.now() + 86400_000),
    createdAt: new Date("2026-06-01"),
    ...overrides,
  };
}

let store: SessionStore;
let svc: SessionManagementService;

beforeEach(() => {
  store = makeStore();
  svc = new SessionManagementService(store as never, makeDatabase());
});

describe("listSessions", () => {
  it("쿠키 없으면 current = false, id 는 session public_id", async () => {
    vi.mocked(store.listActiveByUser).mockResolvedValue([makeSessionRow()]);

    const result = await svc.listSessions("user-1");

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("ses_AAAAAAAAAAAAAAAAAAAAAA0001");
    expect(result[0]?.current).toBe(false);
    expect(JSON.stringify(result[0])).not.toContain("refreshTokenHash");
  });

  it("refresh_token 쿠키로 current 세션 식별", async () => {
    const token = "my-refresh-token";
    const hash = hashToken(token);
    vi.mocked(store.listActiveByUser).mockResolvedValue([
      makeSessionRow({ publicId: "ses_CURRENT00000000000000001", refreshTokenHash: hash }),
      makeSessionRow({ publicId: "ses_OTHER000000000000000002", refreshTokenHash: "other-hash" }),
    ]);

    const result = await svc.listSessions("user-1", token);

    expect(result.find((s) => s.id === "ses_CURRENT00000000000000001")?.current).toBe(true);
    expect(result.find((s) => s.id === "ses_OTHER000000000000000002")?.current).toBe(false);
  });
});

describe("revokeSession", () => {
  it("본인 세션 revoke 성공 (public_id 로 조회, 내부 id 로 revoke)", async () => {
    vi.mocked(store.findByPublicId).mockResolvedValue(
      makeSessionRow({ id: "sess-1", publicId: "ses_X1", userId: "user-1" }),
    );

    await expect(svc.revokeSession("user-1", "ses_X1")).resolves.toBeUndefined();
    expect(store.findByPublicId).toHaveBeenCalledWith("ses_X1");
    expect(store.updateRevoked).toHaveBeenCalledWith("sess-1", expect.any(Date));
  });

  it("타인 세션 → 403 ForbiddenException", async () => {
    vi.mocked(store.findByPublicId).mockResolvedValue(
      makeSessionRow({ publicId: "ses_X1", userId: "user-2" }),
    );

    await expect(svc.revokeSession("user-1", "ses_X1")).rejects.toBeInstanceOf(ForbiddenException);
    expect(store.updateRevoked).not.toHaveBeenCalled();
  });

  it("존재하지 않는 세션 → 403", async () => {
    vi.mocked(store.findByPublicId).mockResolvedValue(null);

    await expect(svc.revokeSession("user-1", "ses_NOPE")).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});

describe("revokeOtherSessions", () => {
  it("쿠키 없으면 null 전달 (전체 revoke)", async () => {
    await svc.revokeOtherSessions("user-1");

    expect(store.revokeOthers).toHaveBeenCalledWith("user-1", null);
  });

  it("쿠키 있으면 현재 세션 해시 제외", async () => {
    const token = "my-refresh-token";

    await svc.revokeOtherSessions("user-1", token);

    expect(store.revokeOthers).toHaveBeenCalledWith("user-1", hashToken(token));
  });
});
