import { describe, expect, it } from "vitest";
import { generateBackupCodes, hashBackupCodes, verifyBackupCode } from "./backup.js";

describe("generateBackupCodes", () => {
  it("10개의 코드를 반환해야 한다", () => {
    const codes = generateBackupCodes();
    expect(codes).toHaveLength(10);
  });

  it("각 코드는 8자리 hex여야 한다", () => {
    const codes = generateBackupCodes();
    for (const code of codes) {
      expect(/^[0-9a-f]{8}$/.test(code)).toBe(true);
    }
  });

  it("호출할 때마다 다른 코드를 반환해야 한다", () => {
    const a = generateBackupCodes();
    const b = generateBackupCodes();
    expect(a).not.toEqual(b);
  });
});

describe("hashBackupCodes", () => {
  it("동일한 수의 해시를 반환해야 한다", async () => {
    const codes = generateBackupCodes();
    const hashes = await hashBackupCodes(codes);
    expect(hashes).toHaveLength(codes.length);
  });

  it("각 해시는 bcrypt 형식이어야 한다", async () => {
    const codes = generateBackupCodes();
    const hashes = await hashBackupCodes(codes);
    for (const hash of hashes) {
      expect(hash).toMatch(/^\$2[aby]\$/);
    }
  });
});

describe("verifyBackupCode", () => {
  it("매칭되는 코드의 인덱스를 반환해야 한다", async () => {
    const codes = generateBackupCodes();
    const hashes = await hashBackupCodes(codes);
    const idx = await verifyBackupCode(codes[3]!, hashes);
    expect(idx).toBe(3);
  });

  it("매칭되지 않으면 -1을 반환해야 한다", async () => {
    const codes = generateBackupCodes();
    const hashes = await hashBackupCodes(codes);
    const idx = await verifyBackupCode("deadbeef", hashes);
    expect(idx).toBe(-1);
  });

  it("빈 해시 배열이면 -1을 반환해야 한다", async () => {
    const idx = await verifyBackupCode("deadbeef", []);
    expect(idx).toBe(-1);
  });
});
