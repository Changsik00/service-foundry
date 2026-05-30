import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryCache } from "./memory.js";

describe("createMemoryCache", () => {
  it("set/get round-trip", async () => {
    const c = createMemoryCache();
    await c.set("k", { n: 1 });
    expect(await c.get<{ n: number }>("k")).toEqual({ n: 1 });
  });

  it("미스는 null", async () => {
    expect(await createMemoryCache().get("none")).toBeNull();
  });

  it("getOrSet: 미스 시 loader 1회, 히트 시 loader 미호출", async () => {
    const c = createMemoryCache();
    const loader = vi.fn().mockResolvedValue("v");
    expect(await c.getOrSet("k", 60, loader)).toBe("v");
    expect(await c.getOrSet("k", 60, loader)).toBe("v");
    expect(loader).toHaveBeenCalledOnce();
  });

  it("del 후 미스", async () => {
    const c = createMemoryCache();
    await c.set("k", 1);
    await c.del("k");
    expect(await c.get("k")).toBeNull();
  });

  describe("TTL 만료", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it("ttl 경과 후 만료", async () => {
      const c = createMemoryCache();
      await c.set("k", "v", 1); // 1s
      expect(await c.get("k")).toBe("v");
      vi.advanceTimersByTime(1100);
      expect(await c.get("k")).toBeNull();
    });
  });
});
