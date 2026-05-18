import { describe, expect, it } from "vitest";
import { JwtPayload, Role, Session, User } from "./index.js";

describe("Role", () => {
  it("'user' / 'admin' 을 통과시킨다", () => {
    expect(Role.safeParse("user").success).toBe(true);
    expect(Role.safeParse("admin").success).toBe(true);
  });

  it("정의되지 않은 role을 거부한다", () => {
    expect(Role.safeParse("superuser").success).toBe(false);
  });
});

describe("User", () => {
  it("valid User를 통과시킨다", () => {
    const result = User.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: "user@example.com",
      role: "user",
      createdAt: "2026-05-18T10:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });

  it("email 형식 위반을 거부한다", () => {
    const result = User.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: "not-an-email",
      role: "user",
      createdAt: "2026-05-18T10:00:00.000Z",
    });
    expect(result.success).toBe(false);
  });
});

describe("Session", () => {
  it("valid Session을 통과시킨다", () => {
    const result = Session.safeParse({
      userId: "550e8400-e29b-41d4-a716-446655440000",
      expiresAt: "2026-05-19T10:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });
});

describe("JwtPayload", () => {
  it("valid JwtPayload를 통과시킨다", () => {
    const result = JwtPayload.safeParse({
      sub: "550e8400-e29b-41d4-a716-446655440000",
      role: "admin",
      iat: 1715000000,
      exp: 1715086400,
    });
    expect(result.success).toBe(true);
  });

  it("iat 비정수를 거부한다 (z.number().int)", () => {
    const result = JwtPayload.safeParse({
      sub: "550e8400-e29b-41d4-a716-446655440000",
      role: "user",
      iat: 1715000000.5,
      exp: 1715086400,
    });
    expect(result.success).toBe(false);
  });
});
