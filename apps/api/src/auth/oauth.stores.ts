import { Inject } from "@nestjs/common";
import type { OAuthAccountStore, OAuthUserRow } from "@repo/backend-auth-oauth";
import { oauthAccounts, users } from "@repo/backend-schema";
import type { NodePgDatabase } from "@repo/nestjs-database";
import { and, eq } from "drizzle-orm";

export const OAUTH_ACCOUNT_STORE = Symbol("OAUTH_ACCOUNT_STORE");
/** @public OAuth 계정 스토어 주입 데코레이터 — 소비자 서비스 배선 시 사용 (의도적 scaffolding). */
export const InjectOAuthAccountStore = () => Inject(OAUTH_ACCOUNT_STORE);
export type { OAuthAccountStore };

type AnyDb = NodePgDatabase<Record<string, unknown>>;
type OAuthDb = NodePgDatabase<{ users: typeof users; oauthAccounts: typeof oauthAccounts }>;

export function createDrizzleOAuthAccountStore(db: AnyDb): OAuthAccountStore {
  const typedDb = db as OAuthDb;

  return {
    async findUserByEmail(email) {
      const rows = await typedDb.select().from(users).where(eq(users.email, email)).limit(1);
      const row = rows[0];
      if (!row) return undefined;
      return row as OAuthUserRow;
    },

    async findOAuthAccount(provider, providerAccountId) {
      const rows = await typedDb
        .select({ userId: oauthAccounts.userId })
        .from(oauthAccounts)
        .where(
          and(
            eq(oauthAccounts.provider, provider as "google" | "kakao"),
            eq(oauthAccounts.providerAccountId, providerAccountId),
          ),
        )
        .limit(1);
      return rows[0];
    },

    async createUser(email) {
      const [row] = await typedDb.insert(users).values({ email, passwordHash: null }).returning();
      if (!row) throw new Error("createUser: insert returned no row");
      return row as OAuthUserRow;
    },

    async createOAuthAccount(userId, provider, providerAccountId) {
      await typedDb
        .insert(oauthAccounts)
        .values({ userId, provider: provider as "google" | "kakao", providerAccountId });
    },
  };
}
