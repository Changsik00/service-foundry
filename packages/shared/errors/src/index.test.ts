import { describe, expect, it } from "vitest";
import {
  AppError,
  type AppErrorResponse,
  fromJSON,
  isAppErrorResponse,
  STANDARD_ERROR_REGISTRY,
  type StandardErrorCode,
} from "./index.js";

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

describe("toJSON", () => {
  it("serializes core fields without cause", () => {
    const cause = new Error("internal");
    const e = new AppError({
      code: "NOT_FOUND",
      message: "missing",
      statusCode: 404,
      cause,
    });
    const json = e.toJSON();
    expect(json).toEqual({ code: "NOT_FOUND", message: "missing", statusCode: 404 });
    expect("cause" in json).toBe(false);
  });

  it("includes details when present", () => {
    const e = new AppError({
      code: "VALIDATION",
      message: "bad",
      statusCode: 400,
      details: { field: "email" },
    });
    expect(e.toJSON()).toEqual({
      code: "VALIDATION",
      message: "bad",
      statusCode: 400,
      details: { field: "email" },
    });
  });

  it("survives JSON.stringify round-trip", () => {
    const e = new AppError({ code: "CONFLICT", message: "dup", statusCode: 409 });
    const parsed: unknown = JSON.parse(JSON.stringify(e));
    expect(parsed).toEqual({ code: "CONFLICT", message: "dup", statusCode: 409 });
  });
});

describe("isAppErrorResponse", () => {
  it("accepts a valid response shape", () => {
    const obj: AppErrorResponse = { code: "X", message: "x", statusCode: 400 };
    expect(isAppErrorResponse(obj)).toBe(true);
  });

  it("rejects missing or wrong-type fields", () => {
    expect(isAppErrorResponse({ code: "X", message: "x" })).toBe(false);
    expect(isAppErrorResponse({ code: 1, message: "x", statusCode: 400 })).toBe(false);
    expect(isAppErrorResponse({ message: "x", statusCode: 400 })).toBe(false);
  });

  it("rejects non-objects", () => {
    expect(isAppErrorResponse(null)).toBe(false);
    expect(isAppErrorResponse(undefined)).toBe(false);
    expect(isAppErrorResponse("string")).toBe(false);
    expect(isAppErrorResponse(42)).toBe(false);
  });
});

describe("fromJSON", () => {
  it("reconstructs AppError from valid shape", () => {
    const json: AppErrorResponse = { code: "NOT_FOUND", message: "missing", statusCode: 404 };
    const e = fromJSON(json);
    expect(e).toBeInstanceOf(AppError);
    expect(e.code).toBe("NOT_FOUND");
    expect(e.message).toBe("missing");
    expect(e.statusCode).toBe(404);
  });

  it("preserves details on round-trip", () => {
    const json: AppErrorResponse = {
      code: "VALIDATION",
      message: "bad",
      statusCode: 400,
      details: { errors: [{ path: "email", message: "required" }] },
    };
    const e = fromJSON(json);
    expect(e.details).toEqual(json.details);
  });

  it("falls back to internal on invalid shape (preserves original in cause)", () => {
    const invalid = { foo: "bar" };
    const e = fromJSON(invalid);
    expect(e).toBeInstanceOf(AppError);
    expect(e.code).toBe("INTERNAL");
    expect(e.statusCode).toBe(500);
    expect(e.cause).toBe(invalid);
  });

  it("falls back to internal on null/undefined", () => {
    expect(fromJSON(null).code).toBe("INTERNAL");
    expect(fromJSON(undefined).code).toBe("INTERNAL");
  });
});
