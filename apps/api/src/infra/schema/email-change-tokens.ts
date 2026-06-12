import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const emailChangeTokens = pgTable("email_change_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  newEmail: text("new_email").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type EmailChangeTokenRow = typeof emailChangeTokens.$inferSelect;
export type EmailChangeTokenInsert = typeof emailChangeTokens.$inferInsert;
