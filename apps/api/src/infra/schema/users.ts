import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  /** @deprecated global role — OrgRole(owner|admin|member)로 대체 예정 (spec-17-05 이후 제거) */
  role: text("role", { enum: ["user", "admin"] })
    .default("user")
    .notNull(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  orgId: uuid("org_id"),
  /** Firebase/Supabase provider UID (native 유저는 null). Firebase UID는 UUID가 아니므로 text로 저장. */
  providerUid: text("provider_uid").unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type UserRow = typeof users.$inferSelect;
export type UserInsert = typeof users.$inferInsert;
