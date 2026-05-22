import type { AuthResult, CoreAuthSDK, User } from "@repo/auth-contracts";
import { AppError } from "@repo/errors";

import { type AuthApi, buildAuthApi, type SignResponse } from "./auth-api";

// ── Result 타입 ───────────────────────────────────────────────────────────────
type Ok<T> = { ok: true; data: T };
type Err = { ok: false; err: unknown };

const tryRequest = <T>(fn: () => Promise<T>): Promise<Ok<T> | Err> =>
  fn().then(
    (data) => ({ ok: true as const, data }),
    (err) => ({ ok: false as const, err }),
  );

// ── 변환 헬퍼 ─────────────────────────────────────────────────────────────────
const toReason = (err: unknown): "invalid_credentials" | "rate_limited" =>
  err instanceof AppError && err.statusCode === 429 ? "rate_limited" : "invalid_credentials";

const toSuccess = (user: User): Extract<AuthResult, { success: true }> => ({
  success: true,
  user,
  session: { userId: user.id, expiresAt: "" },
});

// ── SDK factory ───────────────────────────────────────────────────────────────
export function createHttpAuthSDK(baseUrl: string): CoreAuthSDK {
  const api: AuthApi = buildAuthApi(baseUrl);
  let currentUser: User | null = null;

  const storeAndSucceed = (user: User): AuthResult => {
    currentUser = user;
    return toSuccess(user);
  };

  const withSign = async (request: () => Promise<SignResponse>): Promise<AuthResult> => {
    const r = await tryRequest(request);
    return r.ok ? storeAndSucceed(r.data.user) : { success: false, reason: toReason(r.err) };
  };

  return {
    signIn: async (input) => {
      const r = await tryRequest(() => api.signIn(input));
      if (!r.ok) return { success: false, reason: toReason(r.err) };
      if ("status" in r.data) {
        return {
          success: false,
          reason: "mfa_required",
          challenge: { challengeId: "", method: "totp", expiresAt: "" },
        };
      }
      return storeAndSucceed(r.data.user);
    },

    signUp: (input) => withSign(() => api.signUp(input)),

    signOut: async () => {
      const r = await tryRequest(() => api.signOut());
      currentUser = null;
      if (!r.ok) throw r.err;
    },

    getCurrentUser: async () => currentUser,

    refresh: async () => {
      const r = await tryRequest(() => api.refresh());
      if (!r.ok) return null;
      currentUser = r.data.user;
      return { userId: currentUser.id, expiresAt: "" };
    },
  };
}
