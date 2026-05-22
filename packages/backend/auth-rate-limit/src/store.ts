import type { FailedLoginInsert, LockoutInsert, LockoutRow } from "./schema.js";

/**
 * `RateLimitStore` — Repository interface (Persistence Ignorance).
 *
 * Application/domain layer (`checkRateLimit` / `recordFailure` / `isLocked` 등) 는 본 interface 만 의존.
 * Drizzle 실 구현은 `./drizzle-store.ts` 의 `drizzleRateLimitStore(db)`. 테스트는 `createFakeStore()`.
 *
 * `auth-session` 의 `SessionStore` 패턴 답습.
 */
export interface RateLimitStore {
  /** IP 단위 카운트 (since 이후의 attempted_at). */
  countRecentByIp(ip: string, since: Date): Promise<number>;
  /** account 단위 카운트. */
  countRecentByAccount(accountKey: string, since: Date): Promise<number>;
  /** failed login insert. */
  insertFailure(row: FailedLoginInsert): Promise<void>;
  /** account 의 모든 failed login 삭제 (성공 시 reset). */
  resetAccount(accountKey: string): Promise<void>;

  /** lockout row 조회. 없으면 null. */
  findLockout(accountKey: string): Promise<LockoutRow | null>;
  /** lockout upsert (PK = accountKey). */
  upsertLockout(row: LockoutInsert): Promise<void>;
  /** lockout 삭제 (성공 또는 만료 후 cleanup). */
  deleteLockout(accountKey: string): Promise<void>;
}
