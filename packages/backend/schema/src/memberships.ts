import { pgEnum, pgTable, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { organizations } from "./organizations.js";
import { users } from "./users.js";

export const orgRoleEnum = pgEnum("org_role", ["owner", "admin", "member"]);

export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    role: orgRoleEnum("role").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("memberships_user_org_idx").on(t.userId, t.orgId)],
);

export type MembershipRow = typeof memberships.$inferSelect;
export type MembershipInsert = typeof memberships.$inferInsert;
