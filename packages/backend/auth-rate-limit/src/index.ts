/**
 * @repo/backend-auth-rate-limit — rate-limit + lockout + CSRF core (ADR-0014).
 *
 * Framework-agnostic. NestJS middleware adapter → phase-06.
 */
export { drizzleRateLimitStore } from "./drizzle-store.js";
export { createFakeRateLimitStore, type FakeRateLimitStore } from "./fake-store.js";
export type {
  FailedLoginInsert,
  FailedLoginRow,
  LockoutInsert,
  LockoutRow,
} from "./schema.js";
export type { RateLimitStore } from "./store.js";
