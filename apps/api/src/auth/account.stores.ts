import { Inject } from "@nestjs/common";
import { memberships, organizations, users } from "@repo/backend-schema";
import type { NodePgDatabase } from "@repo/nestjs-database";
import { and, eq, inArray, ne } from "drizzle-orm";

export const ACCOUNT_USER_STORE = Symbol("ACCOUNT_USER_STORE");
export const InjectAccountUserStore = () => Inject(ACCOUNT_USER_STORE);

export interface AccountUserProfile {
  id: string;
  publicId: string;
  email: string;
  passwordHash: string | null;
  displayName: string | null;
  providerUid: string | null;
  avatarUrl: string | null;
}

export interface AccountUserStore {
  findById(id: string): Promise<AccountUserProfile | null>;
  /** provider 모드(sub=providerUid) /me 해석용 — 내부 id 로 못 찾을 때 fallback. */
  findByProviderUid(providerUid: string): Promise<AccountUserProfile | null>;
  findByEmail(email: string): Promise<{ id: string } | null>;
  /** 내부 org id → org public_id (외부 노출용, ADR-0028). 미존재 시 null. */
  findOrgPublicId(orgId: string): Promise<string | null>;
  updateDisplayName(id: string, displayName: string | null): Promise<void>;
  updatePasswordHash(id: string, passwordHash: string): Promise<void>;
  updateEmail(id: string, email: string): Promise<void>;
  updateAvatarUrl(id: string, url: string | null): Promise<void>;
  softDelete(id: string, maskedEmail: string): Promise<void>;
  isSoleOwnerOfAnyOrg(userId: string): Promise<boolean>;
}

type AnyDb = NodePgDatabase<Record<string, unknown>>;

export function createAccountUserStore(db: AnyDb): AccountUserStore {
  const typedDb = db as NodePgDatabase<{
    users: typeof users;
    memberships: typeof memberships;
    organizations: typeof organizations;
  }>;

  return {
    async findById(id) {
      const rows = await typedDb
        .select({
          id: users.id,
          publicId: users.publicId,
          email: users.email,
          passwordHash: users.passwordHash,
          displayName: users.displayName,
          providerUid: users.providerUid,
          avatarUrl: users.avatarUrl,
        })
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      return rows[0] ?? null;
    },

    async findByProviderUid(providerUid) {
      const rows = await typedDb
        .select({
          id: users.id,
          publicId: users.publicId,
          email: users.email,
          passwordHash: users.passwordHash,
          displayName: users.displayName,
          providerUid: users.providerUid,
          avatarUrl: users.avatarUrl,
        })
        .from(users)
        .where(eq(users.providerUid, providerUid))
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

    async findOrgPublicId(orgId) {
      const rows = await typedDb
        .select({ publicId: organizations.publicId })
        .from(organizations)
        .where(eq(organizations.id, orgId))
        .limit(1);
      return rows[0]?.publicId ?? null;
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

    async updateAvatarUrl(id, url) {
      await typedDb.update(users).set({ avatarUrl: url }).where(eq(users.id, id));
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
      if (ownerOrgs.length === 0) return false;

      // owner org 들의 '다른 멤버'(본인 제외)를 role 과 함께 한 번에 조회 — org 당 2쿼리 N+1 제거.
      const orgIds = ownerOrgs.map((o) => o.orgId);
      const others = await typedDb
        .select({ orgId: memberships.orgId, role: memberships.role })
        .from(memberships)
        .where(and(inArray(memberships.orgId, orgIds), ne(memberships.userId, userId)));

      for (const { orgId } of ownerOrgs) {
        const inOrg = others.filter((o) => o.orgId === orgId);
        const hasOtherOwner = inOrg.some((o) => o.role === "owner");
        // 다른 owner가 없고 + 다른 멤버도 있으면 → sole owner of non-empty org → 차단
        if (!hasOtherOwner && inOrg.length > 0) return true;
      }
      return false;
    },
  };
}
