import { Inject } from "@nestjs/common";
import type { NodePgDatabase } from "@repo/nestjs-database";
import { and, eq, gt } from "drizzle-orm";
import type { PasskeyChallengeRow, PasskeyCredentialRow } from "../infra/schema/index.js";
import { passkeyChallenges, passkeyCredentials } from "../infra/schema/index.js";

export interface PasskeyStore {
  findCredentialsByUserId(userId: string): Promise<PasskeyCredentialRow[]>;
  findCredentialById(credentialId: string): Promise<PasskeyCredentialRow | undefined>;
  insertCredential(data: {
    userId: string;
    credentialId: string;
    publicKey: string;
    counter: number;
    deviceType: string;
    backedUp: boolean;
    transports: string[];
  }): Promise<void>;
  updateCounter(credentialId: string, counter: number): Promise<void>;
  insertChallenge(
    id: string,
    challenge: string,
    userId: string | null,
    expiresAt: Date,
  ): Promise<void>;
  findChallenge(id: string): Promise<PasskeyChallengeRow | undefined>;
  deleteChallenge(id: string): Promise<void>;
}

export const PASSKEY_STORE = Symbol("PASSKEY_STORE");
export const InjectPasskeyStore = () => Inject(PASSKEY_STORE);

type AnyDb = NodePgDatabase<Record<string, unknown>>;

export function createDrizzlePasskeyStore(db: AnyDb): PasskeyStore {
  const creds = db as NodePgDatabase<{ passkeyCredentials: typeof passkeyCredentials }>;
  const challenges = db as NodePgDatabase<{ passkeyChallenges: typeof passkeyChallenges }>;

  return {
    async findCredentialsByUserId(userId) {
      return creds.select().from(passkeyCredentials).where(eq(passkeyCredentials.userId, userId));
    },
    async findCredentialById(credentialId) {
      const rows = await creds
        .select()
        .from(passkeyCredentials)
        .where(eq(passkeyCredentials.credentialId, credentialId));
      return rows[0];
    },
    async insertCredential(data) {
      await creds.insert(passkeyCredentials).values(data);
    },
    async updateCounter(credentialId, counter) {
      await creds
        .update(passkeyCredentials)
        .set({ counter })
        .where(eq(passkeyCredentials.credentialId, credentialId));
    },
    async insertChallenge(id, challenge, userId, expiresAt) {
      await challenges.insert(passkeyChallenges).values({ id, challenge, userId, expiresAt });
    },
    async findChallenge(id) {
      const now = new Date();
      const rows = await challenges
        .select()
        .from(passkeyChallenges)
        .where(and(eq(passkeyChallenges.id, id), gt(passkeyChallenges.expiresAt, now)));
      return rows[0];
    },
    async deleteChallenge(id) {
      await challenges.delete(passkeyChallenges).where(eq(passkeyChallenges.id, id));
    },
  };
}
