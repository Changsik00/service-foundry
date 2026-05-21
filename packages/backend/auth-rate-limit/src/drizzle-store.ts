import type { NodePgDatabase } from "@repo/backend-database";
import { and, count, eq, gte, sql } from "drizzle-orm";

import { failedLogins, lockouts, type schema } from "./schema.js";
import type { RateLimitStore } from "./store.js";

/**
 * `drizzleRateLimitStore` — Drizzle 기반 `RateLimitStore` 구현.
 *
 * 호출자는 `createDatabase({ schema: { failedLogins, lockouts } })` 박은 후 `db` 전달.
 * 본 factory 는 *thin adapter* — 도메인 로직 없음 (`auth-session` 의 `drizzleSessionStore` 답습).
 */
export function drizzleRateLimitStore(db: NodePgDatabase<typeof schema>): RateLimitStore {
  return {
    async countRecentByIp(ip, since) {
      const [row] = await db
        .select({ n: count() })
        .from(failedLogins)
        .where(and(eq(failedLogins.ip, ip), gte(failedLogins.attemptedAt, since)));
      return Number(row?.n ?? 0);
    },
    async countRecentByAccount(accountKey, since) {
      const [row] = await db
        .select({ n: count() })
        .from(failedLogins)
        .where(and(eq(failedLogins.accountKey, accountKey), gte(failedLogins.attemptedAt, since)));
      return Number(row?.n ?? 0);
    },
    async insertFailure(row) {
      await db.insert(failedLogins).values(row);
    },
    async resetAccount(accountKey) {
      await db.delete(failedLogins).where(eq(failedLogins.accountKey, accountKey));
    },
    async findLockout(accountKey) {
      const rows = await db
        .select()
        .from(lockouts)
        .where(eq(lockouts.accountKey, accountKey))
        .limit(1);
      return rows[0] ?? null;
    },
    async upsertLockout(row) {
      await db
        .insert(lockouts)
        .values(row)
        .onConflictDoUpdate({
          target: lockouts.accountKey,
          set: {
            lockedAt: row.lockedAt ?? sql`excluded.locked_at`,
            unlockAt: row.unlockAt,
            streak: row.streak ?? sql`${lockouts.streak} + 1`,
          },
        });
    },
    async deleteLockout(accountKey) {
      await db.delete(lockouts).where(eq(lockouts.accountKey, accountKey));
    },
  };
}
