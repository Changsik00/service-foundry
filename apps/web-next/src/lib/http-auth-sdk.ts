import type { AuthResult, CoreAuthSDK, Session, User } from "@repo/auth-contracts";
import { AppError } from "@repo/errors";
import { createHttpClient, type HttpClient } from "@repo/frontend-http-client";

// ── 1. API 응답 타입 ────────────────────────────────────────────────────────
type SignResponse = { accessToken: string; user: User };
type SignInResponse = SignResponse | { status: "mfa_required" };

// ── 2. API layer: endpoint 정의만 ─────────────────────────────────────────
function buildApi(http: HttpClient) {
  return {
    signIn: (input: unknown) => http.post<SignInResponse>("auth/signin", input),
    signUp: (input: unknown) => http.post<SignResponse>("auth/signup", input),
    signOut: () => http.post("auth/signout"),
    refresh: () => http.post<SignResponse>("auth/refresh"),
  };
}

// ── 3. 공통 변환 헬퍼 ─────────────────────────────────────────────────────
function toReason(err: unknown): "invalid_credentials" | "rate_limited" {
  if (err instanceof AppError && err.statusCode === 429) return "rate_limited";
  return "invalid_credentials";
}

function toSuccess(user: User): Extract<AuthResult, { success: true }> {
  return { success: true, user, session: { userId: user.id, expiresAt: "" } };
}

// ── 4. SDK factory ────────────────────────────────────────────────────────
export function createHttpAuthSDK(baseUrl: string): CoreAuthSDK {
  const api = buildApi(createHttpClient({ baseUrl, credentials: "include" }));
  let currentUser: User | null = null;

  // signIn / signUp 공통 패턴: 호출 → currentUser 갱신 → AuthResult 변환
  async function withSign(call: () => Promise<SignResponse>): Promise<AuthResult> {
    try {
      const { user } = await call();
      currentUser = user;
      return toSuccess(user);
    } catch (err) {
      return { success: false, reason: toReason(err) };
    }
  }

  return {
    async signIn(input): Promise<AuthResult> {
      try {
        const data = await api.signIn(input);
        if ("status" in data) {
          // MFA 처리는 별도 phase로 이월
          return {
            success: false,
            reason: "mfa_required",
            challenge: { challengeId: "", method: "totp", expiresAt: "" },
          };
        }
        currentUser = data.user;
        return toSuccess(currentUser);
      } catch (err) {
        return { success: false, reason: toReason(err) };
      }
    },

    signUp: (input) => withSign(() => api.signUp(input)),

    async signOut(): Promise<void> {
      try {
        await api.signOut();
      } finally {
        currentUser = null;
      }
    },

    getCurrentUser: async () => currentUser,

    async refresh(): Promise<Session | null> {
      try {
        const { user } = await api.refresh();
        currentUser = user;
        return { userId: user.id, expiresAt: "" };
      } catch {
        return null;
      }
    },
  };
}
