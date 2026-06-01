import type { NodePgDatabase } from "@repo/backend-database";
import { AppError } from "@repo/errors";
import { and, eq, isNull } from "drizzle-orm";

import { type schema, sessions } from "./schema.js";
import type { SessionStore } from "./store.js";

/**
 * `drizzleSessionStore` — Drizzle 기반 `SessionStore` 구현.
 *
 * 호출자는 `createDatabase({ schema: { sessions } })` 박은 후 `db` 전달.
 * 본 factory 는 *interface 의 thin adapter* — 도메인 로직 없음.
 */
export function drizzleSessionStore(db: NodePgDatabase<typeof schema>): SessionStore {
  return {
    async insert(row) {
      const [inserted] = await db.insert(sessions).values(row).returning();
      if (!inserted) {
        throw new AppError({
          code: "INTERNAL",
          message: "drizzleSessionStore: insert returned no row",
          statusCode: 500,
        });
      }
      return inserted;
    },
    async findByHash(hash) {
      const rows = await db
        .select()
        .from(sessions)
        .where(eq(sessions.refreshTokenHash, hash))
        .limit(1);
      return rows[0] ?? null;
    },
    async updateRevoked(id, revokedAt) {
      await db.update(sessions).set({ revokedAt }).where(eq(sessions.id, id));
    },
    async bulkRevokeByFamily(family, revokedAt) {
      const result = await db
        .update(sessions)
        .set({ revokedAt })
        .where(and(eq(sessions.refreshTokenFamily, family), isNull(sessions.revokedAt)))
        .returning({ id: sessions.id });
      return result.length;
    },
  };
}
