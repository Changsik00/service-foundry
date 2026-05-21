import { describe, expect, it } from "vitest";

import { DEFAULT_OPTIONS, resolveOptions } from "./options.js";

describe("HashOptions", () => {
  it("DEFAULT_OPTIONS matches OWASP 2023 minimum", () => {
    expect(DEFAULT_OPTIONS).toEqual({
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
      hashLength: 32,
    });
  });

  it("resolveOptions merges partial overrides with defaults", () => {
    expect(resolveOptions()).toEqual(DEFAULT_OPTIONS);
    expect(resolveOptions({ memoryCost: 4096 })).toEqual({
      memoryCost: 4096,
      timeCost: 2,
      parallelism: 1,
      hashLength: 32,
    });
    expect(resolveOptions({ timeCost: 5, parallelism: 4 })).toEqual({
      memoryCost: 19456,
      timeCost: 5,
      parallelism: 4,
      hashLength: 32,
    });
  });
});
