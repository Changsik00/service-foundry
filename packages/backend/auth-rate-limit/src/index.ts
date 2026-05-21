/**
 * @repo/backend-auth-rate-limit — rate-limit + lockout + CSRF core (ADR-0014).
 *
 * Framework-agnostic. NestJS middleware adapter → phase-06.
 */
export { issueCsrfToken, verifyCsrfToken } from "./csrf.js";
export { drizzleRateLimitStore } from "./drizzle-store.js";
export { createFakeRateLimitStore, type FakeRateLimitStore } from "./fake-store.js";
export {
  evaluateLockout,
  isLocked,
  LOCKOUT_DEFAULTS,
  type LockoutOptions,
  type LockoutStatus,
} from "./lockout.js";
export {
  checkRateLimit,
  RATE_LIMIT_DEFAULTS,
  type RateLimitContext,
  type RateLimitDecision,
  type RateLimitOptions,
  recordFailure,
  recordSuccess,
} from "./rate-limit.js";
export type {
  FailedLoginInsert,
  FailedLoginRow,
  LockoutInsert,
  LockoutRow,
} from "./schema.js";
export type { RateLimitStore } from "./store.js";
