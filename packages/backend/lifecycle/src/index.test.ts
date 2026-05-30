import { describe, expect, it, vi } from "vitest";
import { createLifecycle } from "./index.js";

describe("createLifecycle", () => {
  it("기본 ready=true, setReady 반영", () => {
    const lc = createLifecycle();
    expect(lc.isReady()).toBe(true);
    lc.setReady(false);
    expect(lc.isReady()).toBe(false);
  });

  it("ready=false 로 시작 가능", () => {
    expect(createLifecycle({ ready: false }).isReady()).toBe(false);
  });

  it("shutdown: readiness=false 전환 + 훅 실행", async () => {
    const lc = createLifecycle();
    const hook = vi.fn().mockResolvedValue(undefined);
    lc.onShutdown(hook);
    await lc.shutdown();
    expect(lc.isReady()).toBe(false);
    expect(hook).toHaveBeenCalledOnce();
  });

  it("shutdown idempotent — 훅 1회만", async () => {
    const lc = createLifecycle();
    const hook = vi.fn().mockResolvedValue(undefined);
    lc.onShutdown(hook);
    await lc.shutdown();
    await lc.shutdown();
    expect(hook).toHaveBeenCalledOnce();
  });

  it("훅이 멈춰도 timeoutMs 후 resolve (행 방지)", async () => {
    const lc = createLifecycle();
    lc.onShutdown(() => new Promise<void>(() => {})); // never resolves
    const start = Date.now();
    await lc.shutdown({ timeoutMs: 50 });
    expect(Date.now() - start).toBeLessThan(2000);
    expect(lc.isReady()).toBe(false);
  });
});
