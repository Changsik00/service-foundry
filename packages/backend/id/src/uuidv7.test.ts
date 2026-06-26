import { describe, expect, it } from "vitest";
import { uuidv7 } from "./index.js";

// RFC 9562 v7: version nibble = 7, variant = 10xx (8/9/a/b)
const UUID_V7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("uuidv7", () => {
  it("RFC 9562 v7 형식 (version=7, variant=10xx)", () => {
    expect(uuidv7()).toMatch(UUID_V7);
  });

  it("앞 48bit 가 현재 ms timestamp 를 인코딩 (현재 시각 ±5초)", () => {
    const id = uuidv7();
    const hex = id.replace(/-/g, "").slice(0, 12); // 48bit
    const ts = Number.parseInt(hex, 16);
    expect(Math.abs(ts - Date.now())).toBeLessThan(5000);
  });

  it("고유성: 10000개 생성 시 충돌 0", () => {
    const set = new Set<string>();
    for (let i = 0; i < 10000; i++) set.add(uuidv7());
    expect(set.size).toBe(10000);
  });
});
