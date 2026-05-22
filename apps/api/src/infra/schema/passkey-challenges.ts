import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const passkeyChallenges = pgTable("passkey_challenges", {
  id: uuid("id").primaryKey().defaultRandom(),
  challenge: text("challenge").notNull(),
  userId: uuid("user_id"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export type PasskeyChallengeRow = typeof passkeyChallenges.$inferSelect;
export type PasskeyChallengeInsert = typeof passkeyChallenges.$inferInsert;
