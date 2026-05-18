import { describe, expect, it } from "vitest";
import { Email, Pagination, Uuid } from "./index.js";

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

describe("Email", () => {
  it("valid email을 통과시킨다", () => {
    const result = Email.safeParse("user@example.com");
    expect(result.success).toBe(true);
  });

  it("email 형식이 아닌 문자열을 거부한다", () => {
    const result = Email.safeParse("not-an-email");
    expect(result.success).toBe(false);
  });

  it("빈 문자열을 거부한다", () => {
    const result = Email.safeParse("");
    expect(result.success).toBe(false);
  });
});

describe("Pagination", () => {
  it("입력 누락 시 page=1 / perPage=20 기본값을 적용한다", () => {
    const result = Pagination.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ page: 1, perPage: 20 });
    }
  });

  it("명시값을 그대로 통과시킨다", () => {
    const result = Pagination.safeParse({ page: 3, perPage: 50 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ page: 3, perPage: 50 });
    }
  });

  it("page=0을 거부한다 (min 1)", () => {
    const result = Pagination.safeParse({ page: 0, perPage: 20 });
    expect(result.success).toBe(false);
  });

  it("perPage=101을 거부한다 (max 100)", () => {
    const result = Pagination.safeParse({ page: 1, perPage: 101 });
    expect(result.success).toBe(false);
  });
});
