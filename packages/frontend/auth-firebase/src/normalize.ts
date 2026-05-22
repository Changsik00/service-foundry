import type { AuthResult } from "@repo/auth-contracts";
import { AppError } from "@repo/errors";

interface FirebaseError {
  code: string;
  message: string;
}

function isFirebaseError(err: unknown): err is FirebaseError {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as Record<string, unknown>).code === "string" &&
    (err as FirebaseError).code.startsWith("auth/")
  );
}

export function normalizeFirebaseAuthError(err: unknown): AuthResult {
  if (!isFirebaseError(err)) {
    throw err;
  }

  switch (err.code) {
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return { success: false, reason: "invalid_credentials" };

    case "auth/email-already-in-use":
      throw new AppError({ code: "CONFLICT", statusCode: 409, message: "Email already in use" });

    case "auth/too-many-requests":
      return { success: false, reason: "rate_limited" };

    case "auth/user-disabled":
      return { success: false, reason: "account_locked" };

    default:
      throw err;
  }
}
