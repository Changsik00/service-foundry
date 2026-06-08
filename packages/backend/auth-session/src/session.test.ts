import { randomUUID } from "node:crypto";

import { beforeEach, describe, expect, it } from "vitest";

import type { SessionInsert, SessionRow } from "./schema.js";
import { createSession, hashToken, revokeSession, rotateSession } from "./session.js";
import type { SessionStore } from "./store.js";

/** fake in-memory store (Map 기반) — test 친화 */
function createFakeStore(): SessionStore & { rows: Map<string, SessionRow> } {
  const rows = new Map<string, SessionRow>();
  return {
    rows,
    async insert(row: SessionInsert): Promise<SessionRow> {
      const inserted: SessionRow = {
        id: row.id ?? randomUUID(),
        userId: row.userId,
        refreshTokenHash: row.refreshTokenHash,
        refreshTokenFamily: row.refreshTokenFamily,
        createdAt: row.createdAt ?? new Date(),
        expiresAt: row.expiresAt,
        revokedAt: row.revokedAt ?? null,
        orgId: row.orgId ?? null,
      };
      rows.set(inserted.id, inserted);
      return inserted;
    },
    async findByHash(hash: string): Promise<SessionRow | null> {
      for (const row of rows.values()) {
        if (row.refreshTokenHash === hash) return row;
      }
      return null;
    },
    async updateRevoked(id: string, revokedAt: Date): Promise<void> {
      const row = rows.get(id);
      if (row) rows.set(id, { ...row, revokedAt });
    },
    async bulkRevokeByFamily(family: string, revokedAt: Date): Promise<number> {
      let count = 0;
      for (const [id, row] of rows.entries()) {
        if (row.refreshTokenFamily === family && row.revokedAt === null) {
          rows.set(id, { ...row, revokedAt });
          count += 1;
        }
      }
      return count;
    },
  };
}

const userId = "550e8400-e29b-41d4-a716-446655440000";
let store: ReturnType<typeof createFakeStore>;

beforeEach(() => {
  store = createFakeStore();
});

describe("createSession", () => {
  it("token 발급 + DB insert + raw token 반환 (hash 저장)", async () => {
    const { session, refreshToken } = await createSession(store, { userId });

    expect(refreshToken.length).toBeGreaterThanOrEqual(20);
    expect(session.userId).toBe(userId);
    expect(session.refreshTokenHash).toBe(hashToken(refreshToken));
    expect(session.refreshTokenHash).not.toBe(refreshToken); // raw 미저장
    expect(session.revokedAt).toBeNull();
    expect(store.rows.size).toBe(1);
  });

  it("expiresAt = createdAt + ttlMs (default 30d)", async () => {
    const before = Date.now();
    const { session } = await createSession(store, { userId });
    const expiresMs = session.expiresAt.getTime();
    const expectedMin = before + 30 * 24 * 60 * 60 * 1000;
    expect(expiresMs).toBeGreaterThanOrEqual(expectedMin);
  });
});

describe("rotateSession", () => {
  it("active token → rotated (새 token + 기존 revoke + 같은 family)", async () => {
    const { session: s1, refreshToken: t1 } = await createSession(store, { userId });
    const result = await rotateSession(store, t1);

    expect(result.type).toBe("rotated");
    if (result.type !== "rotated") throw new Error("unreachable");

    expect(result.refreshToken).not.toBe(t1);
    expect(result.session.refreshTokenFamily).toBe(s1.refreshTokenFamily); // family 공유

    // 기존 session revoked
    const original = store.rows.get(s1.id);
    expect(original?.revokedAt).toBeInstanceOf(Date);
  });

  it("revoked token (reuse) → family 전체 revoke + reuse_detected", async () => {
    // signin: t1 발급
    const { refreshToken: t1 } = await createSession(store, { userId });
    // rotation: t1 → t2 (t1 revoke, t2 활성)
    const r1 = await rotateSession(store, t1);
    if (r1.type !== "rotated") throw new Error("unreachable");
    const t2 = r1.refreshToken;
    // attacker 가 *이미 revoked 된* t1 제시 → reuse 감지
    const r2 = await rotateSession(store, t1);

    expect(r2.type).toBe("reuse_detected");
    if (r2.type !== "reuse_detected") throw new Error("unreachable");

    // family 전체 revoke — t2 도 revoke (active 였음)
    const t2Row = await store.findByHash(hashToken(t2));
    expect(t2Row?.revokedAt).toBeInstanceOf(Date);
  });

  it("unknown token → not_found", async () => {
    const result = await rotateSession(store, "unknown-token-1234567890");
    expect(result.type).toBe("not_found");
  });

  it("만료된 active token → expired (revoke 박지 않음, 거부만)", async () => {
    const { session, refreshToken } = await createSession(store, { userId });
    // expiresAt 을 *과거* 로 박음 (fake store 직접 조작)
    store.rows.set(session.id, { ...session, expiresAt: new Date(Date.now() - 1000) });

    const result = await rotateSession(store, refreshToken);

    expect(result.type).toBe("expired");
    // expired 는 *revoke 박지 않음* — 그저 거부 (reuse 와 구분)
    const after = store.rows.get(session.id);
    expect(after?.revokedAt).toBeNull();
  });
});

describe("revokeSession", () => {
  it("revokedAt 갱신", async () => {
    const { session } = await createSession(store, { userId });
    await revokeSession(store, session.id);
    const after = store.rows.get(session.id);
    expect(after?.revokedAt).toBeInstanceOf(Date);
  });
});
