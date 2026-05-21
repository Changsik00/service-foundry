import { Inject } from "@nestjs/common";
import type { NodePgDatabase } from "@repo/nestjs-database";
import { eq } from "drizzle-orm";

import type {
  PasswordResetTokenInsert,
  PasswordResetTokenRow,
  UserRow,
} from "../infra/schema/index.js";
import { passwordResetTokens, users } from "../infra/schema/index.js";

export const USER_STORE = Symbol("USER_STORE");
export const PASSWORD_RESET_TOKEN_STORE = Symbol("PASSWORD_RESET_TOKEN_STORE");

export const InjectUserStore = () => Inject(USER_STORE);
export const InjectTokenStore = () => Inject(PASSWORD_RESET_TOKEN_STORE);

export interface UserStore {
  findByEmail(email: string): Promise<UserRow | null>;
  updatePasswordHash(id: string, passwordHash: string): Promise<void>;
  updateEmailVerified(id: string): Promise<void>;
}

export interface PasswordResetTokenStore {
  insert(data: PasswordResetTokenInsert): Promise<void>;
  findByHash(tokenHash: string): Promise<PasswordResetTokenRow | null>;
  markUsed(id: string, usedAt: Date): Promise<void>;
}

type AnyDb = NodePgDatabase<Record<string, unknown>>;

export function createDrizzleUserStore(db: AnyDb): UserStore {
  return {
    async findByEmail(email) {
      const rows = await (db as NodePgDatabase<{ users: typeof users }>)
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      return rows[0] ?? null;
    },
    async updatePasswordHash(id, passwordHash) {
      await (db as NodePgDatabase<{ users: typeof users }>)
        .update(users)
        .set({ passwordHash })
        .where(eq(users.id, id));
    },
    async updateEmailVerified(id) {
      await (db as NodePgDatabase<{ users: typeof users }>)
        .update(users)
        .set({ emailVerified: true })
        .where(eq(users.id, id));
    },
  };
}

export function createDrizzleTokenStore(db: AnyDb): PasswordResetTokenStore {
  return {
    async insert(data) {
      await (db as NodePgDatabase<{ passwordResetTokens: typeof passwordResetTokens }>)
        .insert(passwordResetTokens)
        .values(data);
    },
    async findByHash(tokenHash) {
      const rows = await (db as NodePgDatabase<{ passwordResetTokens: typeof passwordResetTokens }>)
        .select()
        .from(passwordResetTokens)
        .where(eq(passwordResetTokens.tokenHash, tokenHash))
        .limit(1);
      return rows[0] ?? null;
    },
    async markUsed(id, usedAt) {
      await (db as NodePgDatabase<{ passwordResetTokens: typeof passwordResetTokens }>)
        .update(passwordResetTokens)
        .set({ usedAt })
        .where(eq(passwordResetTokens.id, id));
    },
  };
}
