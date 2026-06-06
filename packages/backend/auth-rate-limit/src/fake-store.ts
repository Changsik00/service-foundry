import { randomUUID } from "node:crypto";

import type { FailedLoginInsert, FailedLoginRow, LockoutInsert, LockoutRow } from "./schema.js";
import type { RateLimitStore } from "./store.js";

/**
 * Map 기반 fake `RateLimitStore` — test 친화, DB 의존성 0.
 *
 * `auth-session` 의 `createFakeStore` 답습.
 */
export interface FakeRateLimitStore extends RateLimitStore {
  readonly failedLogins: Map<string, FailedLoginRow>;
  readonly lockouts: Map<string, LockoutRow>;
}

export const createFakeRateLimitStore = (): FakeRateLimitStore => {
  const failedLogins = new Map<string, FailedLoginRow>();
  const lockouts = new Map<string, LockoutRow>();

  return {
    failedLogins,
    lockouts,
    async countRecentByIp(ip: string, since: Date): Promise<number> {
      let n = 0;
      for (const row of failedLogins.values()) {
        if (row.ip === ip && row.attemptedAt >= since) n += 1;
      }
      return n;
    },
    async countRecentByAccount(accountKey: string, since: Date): Promise<number> {
      let n = 0;
      for (const row of failedLogins.values()) {
        if (row.accountKey === accountKey && row.attemptedAt >= since) n += 1;
      }
      return n;
    },
    async insertFailure(row: FailedLoginInsert): Promise<void> {
      const inserted: FailedLoginRow = {
        id: row.id ?? randomUUID(),
        ip: row.ip,
        accountKey: row.accountKey,
        attemptedAt: row.attemptedAt ?? new Date(),
        orgId: row.orgId ?? null,
      };
      failedLogins.set(inserted.id, inserted);
    },
    async resetAccount(accountKey: string): Promise<void> {
      for (const [id, row] of failedLogins) {
        if (row.accountKey === accountKey) failedLogins.delete(id);
      }
    },
    async findLockout(accountKey: string): Promise<LockoutRow | null> {
      return lockouts.get(accountKey) ?? null;
    },
    async upsertLockout(row: LockoutInsert): Promise<void> {
      const merged: LockoutRow = {
        accountKey: row.accountKey,
        lockedAt: row.lockedAt ?? new Date(),
        unlockAt: row.unlockAt,
        streak: row.streak ?? 1,
        orgId: row.orgId ?? null,
      };
      lockouts.set(merged.accountKey, merged);
    },
    async deleteLockout(accountKey: string): Promise<void> {
      lockouts.delete(accountKey);
    },
  };
};
