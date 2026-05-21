import { describe, expect, it } from "vitest";

import { createFakeRateLimitStore } from "./fake-store.js";
import { evaluateLockout, isLocked, LOCKOUT_DEFAULTS } from "./lockout.js";
import { recordFailure, recordSuccess } from "./rate-limit.js";

const IP = "1.2.3.4";
const ACCOUNT = "alice@example.com";

describe("isLocked / evaluateLockout", () => {
  it("returns not-locked when no lockout row exists", async () => {
    const store = createFakeRateLimitStore();
    expect(await isLocked(store, ACCOUNT)).toEqual({ locked: false });
  });

  it("locks the account after threshold failures + reports unlockAt + streak", async () => {
    const store = createFakeRateLimitStore();
    const now = new Date("2026-05-21T10:00:00Z");
    for (let i = 0; i < LOCKOUT_DEFAULTS.threshold; i += 1) {
      await recordFailure(store, { ip: IP, accountKey: ACCOUNT, at: now });
    }
    const lockout = await evaluateLockout(store, { accountKey: ACCOUNT, at: now });
    expect(lockout).not.toBeNull();
    if (!lockout) throw new Error("unreachable");
    expect(lockout.streak).toBe(1);
    expect(lockout.lockedUntil.getTime()).toBe(now.getTime() + LOCKOUT_DEFAULTS.baseCooldownMs);

    const status = await isLocked(store, ACCOUNT, now);
    expect(status.locked).toBe(true);
    if (!status.locked) throw new Error("unreachable");
    expect(status.streak).toBe(1);
  });

  it("auto-unlocks once unlockAt is in the past", async () => {
    const store = createFakeRateLimitStore();
    const lockTime = new Date("2026-05-21T10:00:00Z");
    for (let i = 0; i < LOCKOUT_DEFAULTS.threshold; i += 1) {
      await recordFailure(store, { ip: IP, accountKey: ACCOUNT, at: lockTime });
    }
    await evaluateLockout(store, { accountKey: ACCOUNT, at: lockTime });

    // unlockAt = lockTime + 15min. 16분 후에는 unlocked.
    const later = new Date(lockTime.getTime() + 16 * 60_000);
    expect(await isLocked(store, ACCOUNT, later)).toEqual({ locked: false });
  });

  it("progressive backoff — second lockout doubles cooldown", async () => {
    const store = createFakeRateLimitStore();
    const first = new Date("2026-05-21T10:00:00Z");
    for (let i = 0; i < LOCKOUT_DEFAULTS.threshold; i += 1) {
      await recordFailure(store, { ip: IP, accountKey: ACCOUNT, at: first });
    }
    await evaluateLockout(store, { accountKey: ACCOUNT, at: first });

    // cooldown 만료 후 또 5회 fail
    const second = new Date(first.getTime() + 16 * 60_000);
    for (let i = 0; i < LOCKOUT_DEFAULTS.threshold; i += 1) {
      await recordFailure(store, { ip: IP, accountKey: ACCOUNT, at: second });
    }
    const lockout = await evaluateLockout(store, { accountKey: ACCOUNT, at: second });
    expect(lockout).not.toBeNull();
    if (!lockout) throw new Error("unreachable");
    expect(lockout.streak).toBe(2);
    // 2번째 cooldown = base × 2 = 30분
    expect(lockout.lockedUntil.getTime() - second.getTime()).toBe(
      LOCKOUT_DEFAULTS.baseCooldownMs * 2,
    );
  });

  it("recordSuccess clears lockout + streak (full reset)", async () => {
    const store = createFakeRateLimitStore();
    const now = new Date("2026-05-21T10:00:00Z");
    for (let i = 0; i < LOCKOUT_DEFAULTS.threshold; i += 1) {
      await recordFailure(store, { ip: IP, accountKey: ACCOUNT, at: now });
    }
    await evaluateLockout(store, { accountKey: ACCOUNT, at: now });
    expect((await isLocked(store, ACCOUNT, now)).locked).toBe(true);

    await recordSuccess(store, ACCOUNT);
    expect(await isLocked(store, ACCOUNT, now)).toEqual({ locked: false });
  });
});
