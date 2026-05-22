import type { AuthResult } from "@repo/auth-contracts";
import { AppError } from "@repo/errors";

interface SupabaseAuthError {
  __isAuthError: true;
  message: string;
  status: number;
}

function isSupabaseAuthError(err: unknown): err is SupabaseAuthError {
  return (
    typeof err === "object" &&
    err !== null &&
    "__isAuthError" in err &&
    (err as Record<string, unknown>).__isAuthError === true
  );
}

export function normalizeSupabaseAuthError(err: unknown): AuthResult {
  if (!isSupabaseAuthError(err)) {
    throw err;
  }

  const { message } = err;

  if (message === "Invalid login credentials" || message === "User not found") {
    return { success: false, reason: "invalid_credentials" };
  }

  if (message === "Email not confirmed") {
    return { success: false, reason: "unverified_email" };
  }

  if (message === "Email rate limit exceeded") {
    return { success: false, reason: "rate_limited" };
  }

  if (message === "User already registered") {
    throw new AppError({
      code: "CONFLICT",
      statusCode: 409,
      message: "Email already in use",
    });
  }

  throw err;
}
