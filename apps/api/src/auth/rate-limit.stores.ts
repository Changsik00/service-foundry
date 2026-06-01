import { Inject } from "@nestjs/common";
import { drizzleRateLimitStore, type RateLimitStore } from "@repo/backend-auth-rate-limit";
import type { failedLogins, lockouts } from "@repo/backend-auth-rate-limit/schema";
import type { NodePgDatabase } from "@repo/nestjs-database";

export const RATE_LIMIT_STORE = Symbol("RATE_LIMIT_STORE");
export const InjectRateLimitStore = () => Inject(RATE_LIMIT_STORE);
export type { RateLimitStore };

type AnyDb = NodePgDatabase<Record<string, unknown>>;

export function createDrizzleRateLimitStore(db: AnyDb): RateLimitStore {
  return drizzleRateLimitStore(
    db as NodePgDatabase<{ failedLogins: typeof failedLogins; lockouts: typeof lockouts }>,
  );
}
