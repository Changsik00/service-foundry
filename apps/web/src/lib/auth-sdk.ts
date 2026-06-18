import type { AuthResult, CoreAuthSDK, User } from "@repo/auth-contracts";
import { isCode } from "@repo/errors";
import { fromPromise } from "@repo/utils";

import { type AuthApi, buildAuthApi, type SignResponse } from "./auth-api";
import { decodeJwtExp } from "./jwt";

// ── 변환 헬퍼 ─────────────────────────────────────────────────────────────────
const toReason = (error: unknown): "invalid_credentials" | "rate_limited" =>
  isCode(error, "RATE_LIMIT") ? "rate_limited" : "invalid_credentials";

const toSuccess = (user: User): Extract<AuthResult, { success: true }> => ({
  success: true,
  user,
  session: { userId: user.id, expiresAt: "" },
});

// ── SDK factory ───────────────────────────────────────────────────────────────
export function createAuthSDK(baseUrl: string): CoreAuthSDK {
  const api: AuthApi = buildAuthApi(baseUrl);
  let currentUser: User | null = null;
  // 액세스 토큰 만료(epoch ms) — accessToken JWT 의 exp 디코드. 선제 갱신 타이머용.
  let accessTokenExpiresAt: number | null = null;

  const storeAndSucceed = (value: SignResponse): AuthResult => {
    currentUser = value.user;
    accessTokenExpiresAt = decodeJwtExp(value.accessToken);
    return toSuccess(value.user);
  };

  const withSign = async (request: () => Promise<SignResponse>): Promise<AuthResult> => {
    const r = await fromPromise(request);
    return r.ok ? storeAndSucceed(r.value) : { success: false, reason: toReason(r.error) };
  };

  return {
    signIn: async (input) => {
      const r = await fromPromise(() => api.signIn(input));
      if (!r.ok) return { success: false, reason: toReason(r.error) };
      if ("status" in r.value) {
        return {
          success: false,
          reason: "mfa_required",
          challenge: { challengeId: "", method: "totp", expiresAt: "" },
        };
      }
      return storeAndSucceed(r.value);
    },

    signUp: (input) => withSign(() => api.signUp(input)),

    signOut: async () => {
      const r = await fromPromise(() => api.signOut());
      currentUser = null;
      accessTokenExpiresAt = null;
      if (!r.ok) throw r.error;
    },

    getCurrentUser: async () => currentUser,

    refresh: async () => {
      const r = await fromPromise(() => api.refresh());
      if (!r.ok) return null;
      currentUser = r.value.user;
      accessTokenExpiresAt = decodeJwtExp(r.value.accessToken);
      return { userId: currentUser.id, expiresAt: "" };
    },

    getAccessTokenExpiresAt: () => accessTokenExpiresAt,
  };
}
