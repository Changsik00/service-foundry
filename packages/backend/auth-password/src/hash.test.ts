import { describe, expect, it } from "vitest";

import { hashPassword } from "./hash.js";

const PHC_ARGON2ID =
  /^\$argon2id\$v=19\$m=(\d+),t=(\d+),p=(\d+)\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/;

describe("hashPassword", () => {
  it("returns argon2id PHC string with OWASP 2023 default cost", async () => {
    const hash = await hashPassword("correct horse battery staple");
    const match = hash.match(PHC_ARGON2ID);
    expect(match).not.toBeNull();
    if (!match) throw new Error("unreachable");
    expect(Number(match[1])).toBe(19456); // memoryCost
    expect(Number(match[2])).toBe(2); // timeCost
    expect(Number(match[3])).toBe(1); // parallelism
  });

  it("uses fresh salt — two hashes of the same plaintext differ", async () => {
    const [a, b] = await Promise.all([hashPassword("same"), hashPassword("same")]);
    expect(a).not.toBe(b);
  });

  it("respects cost overrides", async () => {
    const hash = await hashPassword("x", { memoryCost: 8192, timeCost: 1, parallelism: 2 });
    const match = hash.match(PHC_ARGON2ID);
    expect(match).not.toBeNull();
    if (!match) throw new Error("unreachable");
    expect(Number(match[1])).toBe(8192);
    expect(Number(match[2])).toBe(1);
    expect(Number(match[3])).toBe(2);
  });

  it("rejects empty plaintext", async () => {
    await expect(hashPassword("")).rejects.toThrow();
  });
});
