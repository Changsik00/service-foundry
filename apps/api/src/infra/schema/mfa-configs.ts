import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { users } from "./users.js";

export const mfaConfigs = pgTable("mfa_configs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  secret: text("secret").notNull(),
  backupCodeHashes: text("backup_code_hashes").array().notNull().default([]),
  enabled: boolean("enabled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type MfaConfigRow = typeof mfaConfigs.$inferSelect;
export type MfaConfigInsert = typeof mfaConfigs.$inferInsert;
