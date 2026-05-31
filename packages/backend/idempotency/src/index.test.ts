import { createMemoryCache } from "@repo/backend-cache";
import { describe, expect, it, vi } from "vitest";
import { withIdempotency } from "./index.js";

describe("withIdempotency", () => {
  it("첫 호출: fn 1회 실행 + 결과 반환", async () => {
    const cache = createMemoryCache();
    const fn = vi.fn().mockResolvedValue({ ok: 1 });
    const r = await withIdempotency(cache, "k1", 60, fn);
    expect(r).toEqual({ ok: 1 });
    expect(fn).toHaveBeenCalledOnce();
  });

  it("같은 key 재호출: fn 미실행 + 저장값 재생", async () => {
    const cache = createMemoryCache();
    const fn = vi.fn().mockResolvedValue({ ok: 1 });
    await withIdempotency(cache, "k1", 60, fn);
    const r2 = await withIdempotency(cache, "k1", 60, fn);
    expect(r2).toEqual({ ok: 1 });
    expect(fn).toHaveBeenCalledOnce();
  });

  it("다른 key: 독립 실행", async () => {
    const cache = createMemoryCache();
    const fn = vi.fn().mockResolvedValue("v");
    await withIdempotency(cache, "a", 60, fn);
    await withIdempotency(cache, "b", 60, fn);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("fn 예외: 캐시에 저장 안 함(재시도 가능)", async () => {
    const cache = createMemoryCache();
    const fn = vi.fn().mockRejectedValueOnce(new Error("boom")).mockResolvedValue("ok");
    await expect(withIdempotency(cache, "k", 60, fn)).rejects.toThrow("boom");
    const r = await withIdempotency(cache, "k", 60, fn);
    expect(r).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
