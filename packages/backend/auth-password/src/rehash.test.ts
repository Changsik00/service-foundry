import { describe, expect, it } from "vitest";

import { hashPassword } from "./hash.js";
import { needsRehash } from "./rehash.js";

describe("needsRehash", () => {
  it("returns true when hash was created with weaker cost than current default", async () => {
    const weak = await hashPassword("x", { memoryCost: 4096, timeCost: 1, parallelism: 1 });
    expect(needsRehash(weak)).toBe(true);
  });

  it("returns false when hash matches current default cost", async () => {
    const current = await hashPassword("x");
    expect(needsRehash(current)).toBe(false);
  });

  it("respects explicit policy in opts", async () => {
    const weak = await hashPassword("x", { memoryCost: 4096, timeCost: 1, parallelism: 1 });
    // 만약 *현 정책* 도 약한 cost 라면 (어느 환경에서) rehash 불요.
    expect(
      needsRehash(weak, { memoryCost: 4096, timeCost: 1, parallelism: 1, hashLength: 32 }),
    ).toBe(false);
    // 정책을 강화하면 rehash 필요.
    expect(needsRehash(weak, { memoryCost: 65536, timeCost: 3, parallelism: 1 })).toBe(true);
  });
});
