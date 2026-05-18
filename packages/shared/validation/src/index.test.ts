import { describe, expect, it } from "vitest";
import { Uuid } from "./index.js";

describe("Uuid", () => {
  it("valid v4 UUID를 통과시킨다", () => {
    const result = Uuid.safeParse("550e8400-e29b-41d4-a716-446655440000");
    expect(result.success).toBe(true);
  });

  it("UUID 형식이 아닌 문자열을 거부한다", () => {
    const result = Uuid.safeParse("not-a-uuid");
    expect(result.success).toBe(false);
  });

  it("빈 문자열을 거부한다", () => {
    const result = Uuid.safeParse("");
    expect(result.success).toBe(false);
  });
});
