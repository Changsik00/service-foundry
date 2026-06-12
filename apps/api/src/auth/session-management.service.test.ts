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
    listActiveByUser: vi.fn(),
    revokeOthers: vi.fn(),
  };
}

function makeSessionRow(
  overrides: Partial<{
    id: string;
    userId: string;
    refreshTokenHash: string;
    orgId: string | null;
  }> = {},
) {
  return {
    id: "sess-1",
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
  svc = new SessionManagementService(store as never);
});

describe("listSessions", () => {
  it("쿠키 없으면 current = false", async () => {
    vi.mocked(store.listActiveByUser).mockResolvedValue([makeSessionRow()]);

    const result = await svc.listSessions("user-1");

    expect(result).toHaveLength(1);
    expect(result[0]?.current).toBe(false);
    expect(JSON.stringify(result[0])).not.toContain("refreshTokenHash");
  });

  it("refresh_token 쿠키로 current 세션 식별", async () => {
    const token = "my-refresh-token";
    const hash = hashToken(token);
    vi.mocked(store.listActiveByUser).mockResolvedValue([
      makeSessionRow({ id: "sess-1", refreshTokenHash: hash }),
      makeSessionRow({ id: "sess-2", refreshTokenHash: "other-hash" }),
    ]);

    const result = await svc.listSessions("user-1", token);

    expect(result.find((s) => s.id === "sess-1")?.current).toBe(true);
    expect(result.find((s) => s.id === "sess-2")?.current).toBe(false);
  });
});

describe("revokeSession", () => {
  it("본인 세션 revoke 성공", async () => {
    vi.mocked(store.findById).mockResolvedValue(makeSessionRow({ id: "sess-1", userId: "user-1" }));

    await expect(svc.revokeSession("user-1", "sess-1")).resolves.toBeUndefined();
    expect(store.updateRevoked).toHaveBeenCalledWith("sess-1", expect.any(Date));
  });

  it("타인 세션 → 403 ForbiddenException", async () => {
    vi.mocked(store.findById).mockResolvedValue(makeSessionRow({ id: "sess-1", userId: "user-2" }));

    await expect(svc.revokeSession("user-1", "sess-1")).rejects.toBeInstanceOf(ForbiddenException);
    expect(store.updateRevoked).not.toHaveBeenCalled();
  });

  it("존재하지 않는 세션 → 403", async () => {
    vi.mocked(store.findById).mockResolvedValue(null);

    await expect(svc.revokeSession("user-1", "sess-999")).rejects.toBeInstanceOf(
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
