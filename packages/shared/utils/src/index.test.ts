import { describe, expect, it } from "vitest";
import { omit, pick, sleep } from "./index.js";

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

describe("pick", () => {
  it("returns an object with only the specified keys", () => {
    const source = { a: 1, b: 2, c: 3 } as const;
    expect(pick(source, ["a", "c"])).toEqual({ a: 1, c: 3 });
  });

  it("returns an empty object when keys is empty", () => {
    expect(pick({ a: 1, b: 2 }, [])).toEqual({});
  });

  it("ignores keys that do not exist on the source", () => {
    const source = { a: 1 } as { a: number; b?: number };
    expect(pick(source, ["a", "b"])).toEqual({ a: 1 });
  });
});

describe("omit", () => {
  it("returns an object without the specified keys", () => {
    const source = { a: 1, b: 2, c: 3 } as const;
    expect(omit(source, ["b"])).toEqual({ a: 1, c: 3 });
  });

  it("returns a shallow copy when keys is empty", () => {
    const source = { a: 1, b: 2 };
    const result = omit(source, []);
    expect(result).toEqual({ a: 1, b: 2 });
    expect(result).not.toBe(source);
  });

  it("returns an empty object when all keys are omitted", () => {
    expect(omit({ a: 1, b: 2 }, ["a", "b"])).toEqual({});
  });
});
