import { describe, expect, it } from "vitest";

import { createFakeRateLimitStore } from "./fake-store.js";
import { checkRateLimit, recordFailure, recordSuccess } from "./rate-limit.js";

const IP = "1.2.3.4";
const ACCOUNT = "alice@example.com";

describe("checkRateLimit / recordFailure / recordSuccess", () => {
  it("allows attempt under both limits", async () => {
    const store = createFakeRateLimitStore();
    const decision = await checkRateLimit(store, { ip: IP, accountKey: ACCOUNT });
    expect(decision.allowed).toBe(true);
  });

  it("blocks when account-level threshold reached", async () => {
    const store = createFakeRateLimitStore();
    const now = new Date();
    // 5 failures 누적 (account limit = 5)
    for (let i = 0; i < 5; i += 1) {
      await recordFailure(store, { ip: IP, accountKey: ACCOUNT, at: now });
    }
    const decision = await checkRateLimit(store, { ip: IP, accountKey: ACCOUNT, at: now });
    expect(decision.allowed).toBe(false);
    if (decision.allowed) throw new Error("unreachable");
    expect(decision.reason).toBe("rate_limited");
    expect(decision.retryAfterMs).toBeGreaterThan(0);
  });

  it("blocks when IP-level threshold reached (different accounts)", async () => {
    const store = createFakeRateLimitStore();
    const now = new Date();
    // 30 failures from same IP, different accounts (account limit 미적용)
    for (let i = 0; i < 30; i += 1) {
      await recordFailure(store, { ip: IP, accountKey: `user${i}@example.com`, at: now });
    }
    const decision = await checkRateLimit(store, {
      ip: IP,
      accountKey: "new@example.com",
      at: now,
    });
    expect(decision.allowed).toBe(false);
  });

  it("window slide — old failures outside window are not counted", async () => {
    const store = createFakeRateLimitStore();
    const old = new Date(Date.now() - 10 * 60_000); // 10분 전 (window 5분 밖)
    for (let i = 0; i < 10; i += 1) {
      await recordFailure(store, { ip: IP, accountKey: ACCOUNT, at: old });
    }
    const decision = await checkRateLimit(store, { ip: IP, accountKey: ACCOUNT });
    expect(decision.allowed).toBe(true);
  });

  it("recordSuccess resets account counter but preserves IP counter", async () => {
    const store = createFakeRateLimitStore();
    const now = new Date();
    for (let i = 0; i < 3; i += 1) {
      await recordFailure(store, { ip: IP, accountKey: ACCOUNT, at: now });
    }
    // 같은 IP, 다른 account 로 5회 (IP count = 8 < 30)
    for (let i = 0; i < 5; i += 1) {
      await recordFailure(store, { ip: IP, accountKey: `other${i}@example.com`, at: now });
    }
    await recordSuccess(store, ACCOUNT);

    const accountSince = new Date(now.getTime() - 5 * 60_000);
    expect(await store.countRecentByAccount(ACCOUNT, accountSince)).toBe(0);
    expect(await store.countRecentByIp(IP, accountSince)).toBe(5); // 다른 account 의 failure 보존
  });
});
