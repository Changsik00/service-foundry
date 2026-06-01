import { isAppError } from "@repo/errors";
import { describe, expect, it } from "vitest";
import { createEnvSecrets, createMemorySecrets } from "./index.js";

describe("createEnvSecrets", () => {
  it("get — 존재 시 값, 부재 시 null", async () => {
    const s = createEnvSecrets({ API_KEY: "k1" });
    expect(await s.get("API_KEY")).toBe("k1");
    expect(await s.get("MISSING")).toBeNull();
  });

  it("require — 존재 시 값", async () => {
    const s = createEnvSecrets({ API_KEY: "k1" });
    expect(await s.require("API_KEY")).toBe("k1");
  });

  it("require — 부재 시 AppError(INTERNAL)", async () => {
    const s = createEnvSecrets({});
    try {
      await s.require("MISSING");
      expect.fail("should throw");
    } catch (e) {
      expect(isAppError(e)).toBe(true);
      if (isAppError(e)) expect(e.code).toBe("INTERNAL");
    }
  });
});

describe("createMemorySecrets", () => {
  it("get / require 동작", async () => {
    const s = createMemorySecrets({ TOKEN: "t1" });
    expect(await s.get("TOKEN")).toBe("t1");
    expect(await s.require("TOKEN")).toBe("t1");
    expect(await s.get("NOPE")).toBeNull();
  });
});
