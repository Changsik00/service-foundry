import { Inject } from "@nestjs/common";
import type { EmailVerifyTokenInsert, EmailVerifyTokenRow } from "@repo/backend-schema";
import { emailVerifyTokens } from "@repo/backend-schema";
import type { NodePgDatabase } from "@repo/nestjs-database";
import { eq } from "drizzle-orm";

export const EMAIL_VERIFY_TOKEN_STORE = Symbol("EMAIL_VERIFY_TOKEN_STORE");

export const InjectEmailVerifyTokenStore = () => Inject(EMAIL_VERIFY_TOKEN_STORE);

export interface EmailVerifyTokenStore {
  insert(data: EmailVerifyTokenInsert): Promise<void>;
  findByHash(tokenHash: string): Promise<EmailVerifyTokenRow | null>;
  markUsed(id: string, usedAt: Date): Promise<void>;
}

type AnyDb = NodePgDatabase<Record<string, unknown>>;

export function createDrizzleEmailVerifyTokenStore(db: AnyDb): EmailVerifyTokenStore {
  return {
    async insert(data) {
      await (db as NodePgDatabase<{ emailVerifyTokens: typeof emailVerifyTokens }>)
        .insert(emailVerifyTokens)
        .values(data);
    },
    async findByHash(tokenHash) {
      const rows = await (db as NodePgDatabase<{ emailVerifyTokens: typeof emailVerifyTokens }>)
        .select()
        .from(emailVerifyTokens)
        .where(eq(emailVerifyTokens.tokenHash, tokenHash))
        .limit(1);
      return rows[0] ?? null;
    },
    async markUsed(id, usedAt) {
      await (db as NodePgDatabase<{ emailVerifyTokens: typeof emailVerifyTokens }>)
        .update(emailVerifyTokens)
        .set({ usedAt })
        .where(eq(emailVerifyTokens.id, id));
    },
  };
}
