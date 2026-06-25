import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * sessions — refresh token rotation chain (ADR-0013).
 *
 * - `refreshTokenHash`: SHA-256 hex (raw token DB 미저장, ADR-0014)
 * - `refreshTokenFamily`: rotation chain — reuse 시 family 전체 revoke
 * - `revokedAt`: nullable (active session 은 null)
 */
export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** 외부 노출 불투명 식별자 (ADR-0028). */
  publicId: text("public_id").notNull().unique().default(sql`gen_public_id('ses')`),
  userId: uuid("user_id").notNull(),
  refreshTokenHash: text("refresh_token_hash").notNull().unique(),
  refreshTokenFamily: uuid("refresh_token_family").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  orgId: uuid("org_id"),
});

export type SessionRow = typeof sessions.$inferSelect;
export type SessionInsert = typeof sessions.$inferInsert;

/** 본 schema 의 typed drizzle DB type (호출자가 `NodePgDatabase<typeof schema>` 박을 때 사용). */
export const schema = { sessions };
