import { Inject } from "@nestjs/common";
import type { NodePgDatabase } from "@repo/nestjs-database";
import { and, eq, ne } from "drizzle-orm";

import { memberships, users } from "../infra/schema/index.js";

export const ACCOUNT_USER_STORE = Symbol("ACCOUNT_USER_STORE");
export const InjectAccountUserStore = () => Inject(ACCOUNT_USER_STORE);

export interface AccountUserStore {
  findById(id: string): Promise<{
    id: string;
    email: string;
    passwordHash: string | null;
    displayName: string | null;
  } | null>;
  updateDisplayName(id: string, displayName: string | null): Promise<void>;
  updatePasswordHash(id: string, passwordHash: string): Promise<void>;
  softDelete(id: string, maskedEmail: string): Promise<void>;
  isSoleOwnerOfAnyOrg(userId: string): Promise<boolean>;
}

type AnyDb = NodePgDatabase<Record<string, unknown>>;

export function createAccountUserStore(db: AnyDb): AccountUserStore {
  const typedDb = db as NodePgDatabase<{ users: typeof users; memberships: typeof memberships }>;

  return {
    async findById(id) {
      const rows = await typedDb
        .select({
          id: users.id,
          email: users.email,
          passwordHash: users.passwordHash,
          displayName: users.displayName,
        })
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      return rows[0] ?? null;
    },

    async updateDisplayName(id, displayName) {
      await typedDb.update(users).set({ displayName }).where(eq(users.id, id));
    },

    async updatePasswordHash(id, passwordHash) {
      await typedDb.update(users).set({ passwordHash }).where(eq(users.id, id));
    },

    async softDelete(id, maskedEmail) {
      await typedDb
        .update(users)
        .set({ email: maskedEmail, deletedAt: new Date() })
        .where(eq(users.id, id));
    },

    async isSoleOwnerOfAnyOrg(userId) {
      const ownerOrgs = await typedDb
        .select({ orgId: memberships.orgId })
        .from(memberships)
        .where(and(eq(memberships.userId, userId), eq(memberships.role, "owner")));

      for (const { orgId } of ownerOrgs) {
        const otherOwners = await typedDb
          .select({ id: memberships.id })
          .from(memberships)
          .where(
            and(
              eq(memberships.orgId, orgId),
              eq(memberships.role, "owner"),
              ne(memberships.userId, userId),
            ),
          )
          .limit(1);
        if (otherOwners.length === 0) return true;
      }
      return false;
    },
  };
}
