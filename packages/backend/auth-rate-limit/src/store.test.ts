import { describe, expect, it } from "vitest";

import { createFakeRateLimitStore } from "./fake-store.js";

describe("RateLimitStore contract (via fake-store)", () => {
  it("inserts + counts failed logins by ip and account", async () => {
    const store = createFakeRateLimitStore();
    const since = new Date(Date.now() - 60_000);
    await store.insertFailure({ ip: "1.2.3.4", accountKey: "alice@example.com" });
    await store.insertFailure({ ip: "1.2.3.4", accountKey: "bob@example.com" });
    await store.insertFailure({ ip: "5.6.7.8", accountKey: "alice@example.com" });

    expect(await store.countRecentByIp("1.2.3.4", since)).toBe(2);
    expect(await store.countRecentByIp("5.6.7.8", since)).toBe(1);
    expect(await store.countRecentByAccount("alice@example.com", since)).toBe(2);
    expect(await store.countRecentByAccount("nobody@example.com", since)).toBe(0);
  });

  it("upserts + finds + deletes lockouts", async () => {
    const store = createFakeRateLimitStore();
    expect(await store.findLockout("alice@example.com")).toBeNull();

    const now = new Date();
    const unlockAt = new Date(now.getTime() + 15 * 60_000);
    await store.upsertLockout({
      accountKey: "alice@example.com",
      lockedAt: now,
      unlockAt,
      streak: 1,
    });
    const row = await store.findLockout("alice@example.com");
    expect(row?.accountKey).toBe("alice@example.com");
    expect(row?.streak).toBe(1);

    // upsert overwrite (streak ++)
    await store.upsertLockout({
      accountKey: "alice@example.com",
      lockedAt: now,
      unlockAt,
      streak: 2,
    });
    expect((await store.findLockout("alice@example.com"))?.streak).toBe(2);

    await store.deleteLockout("alice@example.com");
    expect(await store.findLockout("alice@example.com")).toBeNull();
  });

  it("resetAccount removes only the account's failed logins", async () => {
    const store = createFakeRateLimitStore();
    const since = new Date(Date.now() - 60_000);
    await store.insertFailure({ ip: "1.2.3.4", accountKey: "alice@example.com" });
    await store.insertFailure({ ip: "1.2.3.4", accountKey: "bob@example.com" });
    await store.resetAccount("alice@example.com");

    expect(await store.countRecentByAccount("alice@example.com", since)).toBe(0);
    expect(await store.countRecentByAccount("bob@example.com", since)).toBe(1);
    expect(await store.countRecentByIp("1.2.3.4", since)).toBe(1);
  });
});
