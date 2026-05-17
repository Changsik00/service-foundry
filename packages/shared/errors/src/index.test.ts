import { describe, expect, it } from "vitest";
import { AppError, STANDARD_ERROR_REGISTRY, type StandardErrorCode } from "./index.js";

describe("AppError", () => {
  it("constructs with all fields", () => {
    const e = new AppError({ code: "NOT_FOUND", message: "User missing", statusCode: 404 });
    expect(e).toBeInstanceOf(Error);
    expect(e).toBeInstanceOf(AppError);
    expect(e.code).toBe("NOT_FOUND");
    expect(e.message).toBe("User missing");
    expect(e.statusCode).toBe(404);
    expect(e.details).toBeUndefined();
    expect(e.cause).toBeUndefined();
  });

  it("preserves details and cause", () => {
    const cause = new Error("DB down");
    const e = new AppError({
      code: "INTERNAL",
      message: "Query failed",
      statusCode: 500,
      details: { query: "SELECT 1" },
      cause,
    });
    expect(e.details).toEqual({ query: "SELECT 1" });
    expect(e.cause).toBe(cause);
  });

  it("sets name to 'AppError'", () => {
    const e = new AppError({ code: "X", message: "x", statusCode: 500 });
    expect(e.name).toBe("AppError");
  });
});

describe("STANDARD_ERROR_REGISTRY", () => {
  it("contains all 8 standard codes with statusCode and title", () => {
    const expected: StandardErrorCode[] = [
      "VALIDATION",
      "UNAUTHENTICATED",
      "FORBIDDEN",
      "NOT_FOUND",
      "CONFLICT",
      "RATE_LIMIT",
      "INTERNAL",
      "BAD_GATEWAY",
    ];
    for (const code of expected) {
      expect(STANDARD_ERROR_REGISTRY[code]).toBeDefined();
      expect(typeof STANDARD_ERROR_REGISTRY[code].statusCode).toBe("number");
      expect(typeof STANDARD_ERROR_REGISTRY[code].title).toBe("string");
    }
  });

  it("maps codes to HTTP 4xx/5xx", () => {
    expect(STANDARD_ERROR_REGISTRY.VALIDATION.statusCode).toBe(400);
    expect(STANDARD_ERROR_REGISTRY.NOT_FOUND.statusCode).toBe(404);
    expect(STANDARD_ERROR_REGISTRY.INTERNAL.statusCode).toBe(500);
    expect(STANDARD_ERROR_REGISTRY.BAD_GATEWAY.statusCode).toBe(502);
  });
});
