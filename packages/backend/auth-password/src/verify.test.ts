import { isAppError } from "@repo/errors";
import { describe, expect, it } from "vitest";

import { hashPassword } from "./hash.js";
import { verifyPassword } from "./verify.js";

describe("verifyPassword", () => {
  it("round-trip — correct password returns true", async () => {
    const hash = await hashPassword("s3cret-passphrase");
    expect(await verifyPassword("s3cret-passphrase", hash)).toBe(true);
  });

  it("wrong password returns false (no throw)", async () => {
    const hash = await hashPassword("right");
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });

  it("empty plaintext returns false (does not match any hash)", async () => {
    const hash = await hashPassword("anything");
    expect(await verifyPassword("", hash)).toBe(false);
  });

  it("malformed hash throws AppError(PASSWORD_HASH_MALFORMED)", async () => {
    let caught: unknown;
    try {
      await verifyPassword("x", "not-a-phc-string");
    } catch (e) {
      caught = e;
    }
    expect(isAppError(caught)).toBe(true);
    if (!isAppError(caught)) throw new Error("unreachable");
    expect(caught.code).toBe("PASSWORD_HASH_MALFORMED");
    expect(caught.statusCode).toBe(500);
  });
});
