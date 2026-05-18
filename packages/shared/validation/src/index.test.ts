import { describe, expect, it } from "vitest";
import { z } from "zod";
import { Email, fromZodError, Pagination, parse, Uuid } from "./index.js";

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

describe("parse", () => {
  it("성공 시 ok(data)를 반환한다", () => {
    const result = parse(Email, "user@example.com");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe("user@example.com");
    }
  });

  it("실패 시 err(AppError) + code=VALIDATION을 반환한다", () => {
    const result = parse(Email, "not-an-email");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION");
      expect(result.error.statusCode).toBe(400);
    }
  });

  it("중첩 schema 실패 시 details.errors path가 올바르다", () => {
    const schema = z.object({ user: z.object({ email: Email }) });
    const result = parse(schema, { user: { email: "bad" } });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const details = result.error.details as { errors: Array<{ path: string; message: string }> };
      expect(details.errors[0]?.path).toBe("user.email");
    }
  });

  it("array index path 실패도 동일하게 path가 올바르다", () => {
    const schema = z.object({
      items: z.array(z.object({ id: Uuid })),
    });
    const result = parse(schema, { items: [{ id: "bad" }] });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const details = result.error.details as { errors: Array<{ path: string; message: string }> };
      expect(details.errors[0]?.path).toBe("items.0.id");
    }
  });

  it("custom message override가 적용된다", () => {
    const result = parse(Email, "bad", "도메인 메시지");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe("도메인 메시지");
    }
  });

  it("zod transform/refine schema도 처리한다 (성공/실패)", () => {
    const schema = z
      .string()
      .transform((s) => s.trim())
      .refine((s) => s.length > 0, { message: "empty after trim" });

    const ok = parse(schema, "  hello  ");
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(ok.value).toBe("hello");
    }

    const ng = parse(schema, "   ");
    expect(ng.ok).toBe(false);
    if (!ng.ok) {
      expect(ng.error.code).toBe("VALIDATION");
      const details = ng.error.details as { errors: Array<{ path: string; message: string }> };
      expect(details.errors[0]?.message).toBe("empty after trim");
    }
  });
});
