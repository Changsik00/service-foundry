import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const featureFlags = pgTable("feature_flags", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),
  description: text("description"),
  enabled: boolean("enabled").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type FeatureFlagRow = typeof featureFlags.$inferSelect;
export type FeatureFlagInsert = typeof featureFlags.$inferInsert;
