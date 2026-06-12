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
    providerUid: string | null;
  } | null>;
  findByEmail(email: string): Promise<{ id: string } | null>;
  updateDisplayName(id: string, displayName: string | null): Promise<void>;
  updatePasswordHash(id: string, passwordHash: string): Promise<void>;
  updateEmail(id: string, email: string): Promise<void>;
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
          providerUid: users.providerUid,
        })
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      return rows[0] ?? null;
    },

    async findByEmail(email) {
      const rows = await typedDb
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      return rows[0] ?? null;
    },

    async updateDisplayName(id, displayName) {
      await typedDb.update(users).set({ displayName }).where(eq(users.id, id));
    },

    async updatePasswordHash(id, passwordHash) {
      await typedDb.update(users).set({ passwordHash }).where(eq(users.id, id));
    },

    async updateEmail(id, email) {
      await typedDb.update(users).set({ email }).where(eq(users.id, id));
    },

    async softDelete(id, maskedEmail) {
      await typedDb
        .update(users)
        .set({ email: maskedEmail, deletedAt: new Date() })
        .where(eq(users.id, id));
    },

    async isSoleOwnerOfAnyOrg(userId) {
      // org 내 user 이외의 다른 멤버(owner 포함)가 있을 때만 차단 — 본인만 있는 개인 org는 허용.
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

        const otherMembers = await typedDb
          .select({ id: memberships.id })
          .from(memberships)
          .where(and(eq(memberships.orgId, orgId), ne(memberships.userId, userId)))
          .limit(1);

        // 다른 owner가 없고 + 다른 멤버도 있으면 → sole owner of non-empty org → 차단
        if (otherOwners.length === 0 && otherMembers.length > 0) return true;
      }
      return false;
    },
  };
}
