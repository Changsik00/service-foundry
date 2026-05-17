import { describe, expect, it } from "vitest";
import { err, flatMap, isErr, isOk, map, ok, omit, pick, type Result, sleep } from "./index.js";

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

describe("Result", () => {
  it("ok wraps a value", () => {
    expect(ok(42)).toEqual({ ok: true, value: 42 });
  });

  it("err wraps an error", () => {
    const e = new Error("boom");
    expect(err(e)).toEqual({ ok: false, error: e });
  });

  it("isOk narrows to ok branch", () => {
    const r: Result<number, Error> = ok(1);
    expect(isOk(r)).toBe(true);
    if (isOk(r)) {
      expect(r.value).toBe(1);
    }
  });

  it("isErr narrows to err branch", () => {
    const e = new Error("x");
    const r: Result<number, Error> = err(e);
    expect(isErr(r)).toBe(true);
    if (isErr(r)) {
      expect(r.error).toBe(e);
    }
  });

  it("map transforms ok value", () => {
    expect(map(ok(2), (x: number) => x + 1)).toEqual({ ok: true, value: 3 });
  });

  it("map leaves err untouched", () => {
    const e = new Error("x");
    const result = map(err<Error>(e) as Result<number, Error>, (x: number) => x + 1);
    expect(result).toEqual({ ok: false, error: e });
  });

  it("flatMap chains ok results", () => {
    expect(flatMap(ok(2), (x: number) => ok(x + 1))).toEqual({ ok: true, value: 3 });
  });

  it("flatMap leaves err untouched and does not call fn", () => {
    let called = false;
    const e = new Error("x");
    const result = flatMap(err<Error>(e) as Result<number, Error>, (x: number) => {
      called = true;
      return ok(x);
    });
    expect(result).toEqual({ ok: false, error: e });
    expect(called).toBe(false);
  });
});
