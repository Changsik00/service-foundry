import { describe, expect, it } from "vitest";
import { z } from "zod";
import { Email, fromZodError, Pagination, Uuid } from "./index.js";

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

describe("fromZodError", () => {
  it("단일 issue를 details.errors[0]에 path/message로 매핑한다", () => {
    const schema = z.object({ name: z.string() });
    const result = schema.safeParse({ name: 123 });
    if (result.success) throw new Error("expected failure");
    const app = fromZodError(result.error);
    expect(app.code).toBe("VALIDATION");
    expect(app.statusCode).toBe(400);
    const details = app.details as { errors: Array<{ path: string; message: string }> };
    expect(details.errors).toHaveLength(1);
    expect(details.errors[0]?.path).toBe("name");
    expect(typeof details.errors[0]?.message).toBe("string");
  });

  it("중첩 path를 '.' 로 join 한다 (user.email)", () => {
    const schema = z.object({ user: z.object({ email: z.email() }) });
    const result = schema.safeParse({ user: { email: "bad" } });
    if (result.success) throw new Error("expected failure");
    const app = fromZodError(result.error);
    const details = app.details as { errors: Array<{ path: string; message: string }> };
    expect(details.errors[0]?.path).toBe("user.email");
  });

  it("array index path를 'items.0.name' 으로 join 한다", () => {
    const schema = z.object({
      items: z.array(z.object({ name: z.string() })),
    });
    const result = schema.safeParse({ items: [{ name: 1 }] });
    if (result.success) throw new Error("expected failure");
    const app = fromZodError(result.error);
    const details = app.details as { errors: Array<{ path: string; message: string }> };
    expect(details.errors[0]?.path).toBe("items.0.name");
  });

  it("custom message override를 적용하되 zod 기본 message는 details에 보존한다", () => {
    const schema = z.object({ name: z.string() });
    const result = schema.safeParse({ name: 123 });
    if (result.success) throw new Error("expected failure");
    const app = fromZodError(result.error, "사용자 검증 실패");
    expect(app.message).toBe("사용자 검증 실패");
    const details = app.details as { errors: Array<{ path: string; message: string }> };
    // zod 기본 message가 details.errors[].message에 그대로 보존
    expect(details.errors[0]?.message).not.toBe("사용자 검증 실패");
    expect(details.errors[0]?.message.length).toBeGreaterThan(0);
  });
});
