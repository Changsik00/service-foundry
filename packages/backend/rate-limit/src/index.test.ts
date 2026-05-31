import { describe, expect, it } from "vitest";
import { createMemoryRateLimiter } from "./index.js";

describe("createMemoryRateLimiter", () => {
  it("한도 내에서는 허용하고 remaining 이 감소한다", async () => {
    const rl = createMemoryRateLimiter({ limit: 3, windowMs: 1000, now: () => 0 });
    expect(await rl.consume("k")).toEqual({ allowed: true, remaining: 2, retryAfterMs: 0 });
    expect(await rl.consume("k")).toEqual({ allowed: true, remaining: 1, retryAfterMs: 0 });
    expect(await rl.consume("k")).toEqual({ allowed: true, remaining: 0, retryAfterMs: 0 });
  });

  it("한도 초과 시 차단하고 retryAfterMs 를 준다", async () => {
    let t = 0;
    const rl = createMemoryRateLimiter({ limit: 1, windowMs: 1000, now: () => t });
    await rl.consume("k");
    t = 300;
    const blocked = await rl.consume("k");
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterMs).toBe(700); // windowStart(0)+1000 - now(300)
  });

  it("윈도우 경과 후 리셋된다", async () => {
    let t = 0;
    const rl = createMemoryRateLimiter({ limit: 1, windowMs: 1000, now: () => t });
    await rl.consume("k"); // 소진
    t = 1000; // 윈도우 경과
    const after = await rl.consume("k");
    expect(after.allowed).toBe(true);
  });

  it("cost>1 을 한 번에 소비한다", async () => {
    const rl = createMemoryRateLimiter({ limit: 5, windowMs: 1000, now: () => 0 });
    const r = await rl.consume("k", 3);
    expect(r).toEqual({ allowed: true, remaining: 2, retryAfterMs: 0 });
    const over = await rl.consume("k", 3);
    expect(over.allowed).toBe(false);
  });

  it("키별로 독립 카운터", async () => {
    const rl = createMemoryRateLimiter({ limit: 1, windowMs: 1000, now: () => 0 });
    expect((await rl.consume("a")).allowed).toBe(true);
    expect((await rl.consume("b")).allowed).toBe(true);
    expect((await rl.consume("a")).allowed).toBe(false);
  });
});
