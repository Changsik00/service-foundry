import { Inject } from "@nestjs/common";
import type { MfaConfigRow } from "@repo/backend-schema";
import { mfaConfigs } from "@repo/backend-schema";
import type { NodePgDatabase } from "@repo/nestjs-database";
import { eq } from "drizzle-orm";

export interface MfaStore {
  findByUserId(userId: string): Promise<MfaConfigRow | undefined>;
  upsert(userId: string, secret: string): Promise<void>;
  updateEnabled(userId: string, enabled: boolean, backupCodeHashes: string[]): Promise<void>;
  deleteByUserId(userId: string): Promise<void>;
}

export const MFA_STORE = Symbol("MFA_STORE");
export const InjectMfaStore = () => Inject(MFA_STORE);

type AnyDb = NodePgDatabase<Record<string, unknown>>;

export function createDrizzleMfaStore(db: AnyDb): MfaStore {
  const typed = db as NodePgDatabase<{ mfaConfigs: typeof mfaConfigs }>;

  return {
    async findByUserId(userId) {
      const rows = await typed.select().from(mfaConfigs).where(eq(mfaConfigs.userId, userId));
      return rows[0];
    },
    async upsert(userId, secret) {
      await typed
        .insert(mfaConfigs)
        .values({ userId, secret, enabled: false, backupCodeHashes: [] })
        .onConflictDoUpdate({
          target: mfaConfigs.userId,
          set: { secret, enabled: false, backupCodeHashes: [] },
        });
    },
    async updateEnabled(userId, enabled, backupCodeHashes) {
      await typed
        .update(mfaConfigs)
        .set({ enabled, backupCodeHashes })
        .where(eq(mfaConfigs.userId, userId));
    },
    async deleteByUserId(userId) {
      await typed.delete(mfaConfigs).where(eq(mfaConfigs.userId, userId));
    },
  };
}
