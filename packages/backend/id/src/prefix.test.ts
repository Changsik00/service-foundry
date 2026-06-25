import { describe, expect, it } from "vitest";
import { ID_PREFIX } from "./index.js";

describe("ID_PREFIX 레지스트리", () => {
  it("확정 root 4종 prefix 를 제공", () => {
    expect(ID_PREFIX).toEqual({
      user: "usr",
      org: "org",
      session: "ses",
      apiKey: "key",
    });
  });

  it("prefix 값이 모두 고유 (타입 혼동 방지)", () => {
    const values = Object.values(ID_PREFIX);
    expect(new Set(values).size).toBe(values.length);
  });
});
