import { describe, expect, it } from "vitest";
import { sleep } from "./index.js";

describe("sleep", () => {
  it("resolves after at least the requested duration", async () => {
    const start = Date.now();
    await sleep(20);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(15);
  });

  it("resolves immediately when ms is 0", async () => {
    const start = Date.now();
    await sleep(0);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(50);
  });
});
