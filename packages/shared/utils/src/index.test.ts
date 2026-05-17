import { describe, expect, it } from "vitest";
import { identity } from "./index.js";

describe("identity", () => {
  it("returns its argument unchanged", () => {
    expect(identity(42)).toBe(42);
    expect(identity("foo")).toBe("foo");
    const obj = { a: 1 };
    expect(identity(obj)).toBe(obj);
  });
});
