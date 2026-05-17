import { describe, expect, it } from "vitest";
import {
  AppError,
  type AppErrorResponse,
  badGatewayError,
  conflictError,
  errorCause,
  errorMessage,
  forbiddenError,
  fromJSON,
  internalError,
  isAppError,
  isAppErrorResponse,
  isCode,
  isError,
  notFoundError,
  rateLimitError,
  STANDARD_ERROR_REGISTRY,
  type StandardErrorCode,
  unauthenticatedError,
  validationError,
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

describe("isAppError", () => {
  it("returns true for AppError", () => {
    expect(isAppError(new AppError({ code: "X", message: "x", statusCode: 500 }))).toBe(true);
  });

  it("returns false for plain Error / non-Error", () => {
    expect(isAppError(new Error("plain"))).toBe(false);
    expect(isAppError("string")).toBe(false);
    expect(isAppError(null)).toBe(false);
  });
});

describe("isCode", () => {
  it("matches when code equals", () => {
    const e = new AppError({ code: "NOT_FOUND", message: "x", statusCode: 404 });
    expect(isCode(e, "NOT_FOUND")).toBe(true);
  });

  it("rejects when code differs", () => {
    const e = new AppError({ code: "NOT_FOUND", message: "x", statusCode: 404 });
    expect(isCode(e, "VALIDATION")).toBe(false);
  });

  it("rejects non-AppError", () => {
    expect(isCode(new Error("x"), "NOT_FOUND")).toBe(false);
    expect(isCode("string", "NOT_FOUND")).toBe(false);
  });
});

describe("isError", () => {
  it("returns true for Error instance", () => {
    expect(isError(new Error("x"))).toBe(true);
  });

  it("returns true for AppError (extends Error)", () => {
    expect(isError(new AppError({ code: "X", message: "x", statusCode: 500 }))).toBe(true);
  });

  it("returns true for cross-realm Error-like object", () => {
    const fakeCrossRealm = Object.create({}) as object;
    Object.defineProperty(fakeCrossRealm, Symbol.toStringTag, { value: "Error" });
    expect(isError(fakeCrossRealm)).toBe(true);
  });

  it("returns false for non-Error", () => {
    expect(isError("string")).toBe(false);
    expect(isError({ message: "fake" })).toBe(false);
    expect(isError(null)).toBe(false);
    expect(isError(undefined)).toBe(false);
  });
});

describe("errorMessage", () => {
  it("extracts message from AppError", () => {
    const e = new AppError({ code: "X", message: "app msg", statusCode: 500 });
    expect(errorMessage(e)).toBe("app msg");
  });

  it("extracts message from plain Error", () => {
    expect(errorMessage(new Error("plain"))).toBe("plain");
  });

  it("returns string as-is", () => {
    expect(errorMessage("oops")).toBe("oops");
  });

  it("JSON.stringify for plain objects", () => {
    expect(errorMessage({ foo: "bar" })).toBe('{"foo":"bar"}');
  });

  it("handles null and undefined explicitly", () => {
    expect(errorMessage(null)).toBe("null");
    expect(errorMessage(undefined)).toBe("undefined");
  });
});

describe("errorCause", () => {
  it("returns AppError.cause", () => {
    const cause = new Error("root");
    const e = new AppError({ code: "X", message: "x", statusCode: 500, cause });
    expect(errorCause(e)).toBe(cause);
  });

  it("returns Error.cause (ES2022)", () => {
    const root = new Error("root");
    const wrapped = new Error("wrapped", { cause: root });
    expect(errorCause(wrapped)).toBe(root);
  });

  it("returns undefined when no cause", () => {
    expect(errorCause(new Error("no cause"))).toBeUndefined();
    expect(errorCause("string")).toBeUndefined();
    expect(errorCause(null)).toBeUndefined();
  });
});

describe("standard factories", () => {
  const cases = [
    { factory: validationError, code: "VALIDATION", statusCode: 400, supportsDetails: true },
    {
      factory: unauthenticatedError,
      code: "UNAUTHENTICATED",
      statusCode: 401,
      supportsDetails: true,
    },
    { factory: forbiddenError, code: "FORBIDDEN", statusCode: 403, supportsDetails: true },
    { factory: notFoundError, code: "NOT_FOUND", statusCode: 404, supportsDetails: true },
    { factory: conflictError, code: "CONFLICT", statusCode: 409, supportsDetails: true },
    { factory: rateLimitError, code: "RATE_LIMIT", statusCode: 429, supportsDetails: true },
    { factory: internalError, code: "INTERNAL", statusCode: 500, supportsDetails: false },
    { factory: badGatewayError, code: "BAD_GATEWAY", statusCode: 502, supportsDetails: false },
  ] as const;

  for (const { factory, code, statusCode, supportsDetails } of cases) {
    it(`${code}: sets code/statusCode from REGISTRY`, () => {
      const e = factory("msg");
      expect(e).toBeInstanceOf(AppError);
      expect(e.code).toBe(code);
      expect(e.statusCode).toBe(statusCode);
      expect(e.message).toBe("msg");
    });

    if (supportsDetails) {
      it(`${code}: preserves details`, () => {
        const e = factory("msg", { foo: "bar" });
        expect(e.details).toEqual({ foo: "bar" });
      });
    } else {
      it(`${code}: preserves cause`, () => {
        const cause = new Error("root");
        const e = factory("msg", cause);
        expect(e.cause).toBe(cause);
      });
    }
  }
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
