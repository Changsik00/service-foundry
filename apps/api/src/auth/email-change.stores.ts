import { Inject } from "@nestjs/common";
import type { EmailChangeTokenInsert, EmailChangeTokenRow } from "@repo/backend-schema";
import { emailChangeTokens } from "@repo/backend-schema";
import type { NodePgDatabase } from "@repo/nestjs-database";
import { eq } from "drizzle-orm";

export const EMAIL_CHANGE_TOKEN_STORE = Symbol("EMAIL_CHANGE_TOKEN_STORE");
export const InjectEmailChangeTokenStore = () => Inject(EMAIL_CHANGE_TOKEN_STORE);

export interface EmailChangeTokenStore {
  insert(data: EmailChangeTokenInsert): Promise<void>;
  findByHash(tokenHash: string): Promise<EmailChangeTokenRow | null>;
  markUsed(id: string, usedAt: Date): Promise<void>;
}

type AnyDb = NodePgDatabase<Record<string, unknown>>;

export function createEmailChangeTokenStore(db: AnyDb): EmailChangeTokenStore {
  const typedDb = db as NodePgDatabase<{ emailChangeTokens: typeof emailChangeTokens }>;
  return {
    async insert(data) {
      await typedDb.insert(emailChangeTokens).values(data);
    },
    async findByHash(tokenHash) {
      const rows = await typedDb
        .select()
        .from(emailChangeTokens)
        .where(eq(emailChangeTokens.tokenHash, tokenHash))
        .limit(1);
      return rows[0] ?? null;
    },
    async markUsed(id, usedAt) {
      await typedDb.update(emailChangeTokens).set({ usedAt }).where(eq(emailChangeTokens.id, id));
    },
  };
}
