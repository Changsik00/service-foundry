import { json, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const authAuditLogs = pgTable("auth_audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id"),
  eventType: text("event_type").notNull(),
  ip: text("ip"),
  userAgent: text("user_agent"),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type AuditLogRow = typeof authAuditLogs.$inferSelect;
/** @public 감사 로그 insert 타입 — 외부 쓰기 경로 타이핑용 (의도적 scaffolding). */
export type AuditLogInsert = typeof authAuditLogs.$inferInsert;

export const schema = { authAuditLogs };
