import { describe, expect, it } from "vitest";
import { UserProfile } from "./user.js";

describe("UserProfile", () => {
  it("valid한 profile을 통과시킨다", () => {
    const result = UserProfile.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: "user@example.com",
      displayName: "Alice",
      createdAt: "2026-05-18T10:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });

  it("email 형식 위반을 거부한다", () => {
    const result = UserProfile.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: "not-an-email",
      displayName: "Alice",
      createdAt: "2026-05-18T10:00:00.000Z",
    });
    expect(result.success).toBe(false);
  });

  it("displayName 빈 문자열을 거부한다 (min 1)", () => {
    const result = UserProfile.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: "user@example.com",
      displayName: "",
      createdAt: "2026-05-18T10:00:00.000Z",
    });
    expect(result.success).toBe(false);
  });
});
