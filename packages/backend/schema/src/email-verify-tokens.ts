import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const emailVerifyTokens = pgTable("email_verify_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type EmailVerifyTokenRow = typeof emailVerifyTokens.$inferSelect;
export type EmailVerifyTokenInsert = typeof emailVerifyTokens.$inferInsert;
