import { AppError } from "@repo/errors";
import { describe, expect, it } from "vitest";
import { normalizeSupabaseAuthError } from "./normalize.js";

function makeAuthError(message: string, status: number) {
  return Object.assign(new Error(message), { __isAuthError: true, status });
}

describe("normalizeSupabaseAuthError", () => {
  it("Invalid login credentials → invalid_credentials", () => {
    const result = normalizeSupabaseAuthError(makeAuthError("Invalid login credentials", 400));
    expect(result).toEqual({ success: false, reason: "invalid_credentials" });
  });

  it("Email not confirmed → unverified_email", () => {
    const result = normalizeSupabaseAuthError(makeAuthError("Email not confirmed", 400));
    expect(result).toEqual({ success: false, reason: "unverified_email" });
  });

  it("Email rate limit exceeded → rate_limited", () => {
    const result = normalizeSupabaseAuthError(makeAuthError("Email rate limit exceeded", 429));
    expect(result).toEqual({ success: false, reason: "rate_limited" });
  });

  it("User already registered → AppError CONFLICT throw", () => {
    expect(() => normalizeSupabaseAuthError(makeAuthError("User already registered", 422))).toThrow(
      AppError,
    );
  });

  it("User already registered → AppError code CONFLICT", () => {
    try {
      normalizeSupabaseAuthError(makeAuthError("User already registered", 422));
    } catch (err) {
      expect((err as AppError).code).toBe("CONFLICT");
    }
  });

  it("기타 AuthApiError → re-throw", () => {
    const err = makeAuthError("Something unexpected", 500);
    expect(() => normalizeSupabaseAuthError(err)).toThrow(err);
  });

  it("비-Supabase 에러 → re-throw", () => {
    const err = new Error("network error");
    expect(() => normalizeSupabaseAuthError(err)).toThrow(err);
  });

  it("null → re-throw", () => {
    expect(() => normalizeSupabaseAuthError(null)).toThrow();
  });
});
