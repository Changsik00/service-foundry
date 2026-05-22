import { AppError } from "@repo/errors";
import { describe, expect, it } from "vitest";
import { normalizeFirebaseAuthError } from "./normalize.js";

const makeFirebaseError = (code: string) => Object.assign(new Error(`Firebase: ${code}`), { code });

describe("normalizeFirebaseAuthError", () => {
  it("auth/user-not-found → invalid_credentials", () => {
    const result = normalizeFirebaseAuthError(makeFirebaseError("auth/user-not-found"));
    expect(result).toEqual({ success: false, reason: "invalid_credentials" });
  });

  it("auth/wrong-password → invalid_credentials", () => {
    const result = normalizeFirebaseAuthError(makeFirebaseError("auth/wrong-password"));
    expect(result).toEqual({ success: false, reason: "invalid_credentials" });
  });

  it("auth/invalid-credential → invalid_credentials", () => {
    const result = normalizeFirebaseAuthError(makeFirebaseError("auth/invalid-credential"));
    expect(result).toEqual({ success: false, reason: "invalid_credentials" });
  });

  it("auth/email-already-in-use → AppError(CONFLICT) throw", () => {
    expect(() =>
      normalizeFirebaseAuthError(makeFirebaseError("auth/email-already-in-use")),
    ).toThrow(AppError);
  });

  it("auth/too-many-requests → rate_limited", () => {
    const result = normalizeFirebaseAuthError(makeFirebaseError("auth/too-many-requests"));
    expect(result).toEqual({ success: false, reason: "rate_limited" });
  });

  it("auth/user-disabled → account_locked", () => {
    const result = normalizeFirebaseAuthError(makeFirebaseError("auth/user-disabled"));
    expect(result).toEqual({ success: false, reason: "account_locked" });
  });

  it("알 수 없는 FirebaseError → re-throw", () => {
    const err = makeFirebaseError("auth/network-request-failed");
    expect(() => normalizeFirebaseAuthError(err)).toThrow(err);
  });

  it("FirebaseError가 아닌 에러 → re-throw", () => {
    const err = new Error("some other error");
    expect(() => normalizeFirebaseAuthError(err)).toThrow(err);
  });
});
