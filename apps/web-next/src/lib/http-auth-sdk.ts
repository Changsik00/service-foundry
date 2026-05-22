import type { AuthResult, CoreAuthSDK, Session, User } from "@repo/auth-contracts";
import { AppError } from "@repo/errors";
import { createHttpClient } from "@repo/frontend-http-client";

type SignResponse = { accessToken: string; user: User };
type SignInResponse = SignResponse | { status: "mfa_required" };

function toReason(err: unknown): "invalid_credentials" | "rate_limited" {
  if (err instanceof AppError && err.statusCode === 429) return "rate_limited";
  return "invalid_credentials";
}

export function createHttpAuthSDK(baseUrl: string): CoreAuthSDK {
  const http = createHttpClient({ baseUrl, credentials: "include" });
  let currentUser: User | null = null;

  return {
    async signIn(input): Promise<AuthResult> {
      try {
        const data = await http.post<SignInResponse>("auth/signin", input);
        if ("status" in data && data.status === "mfa_required") {
          return {
            success: false,
            reason: "mfa_required",
            challenge: { challengeId: "", method: "totp", expiresAt: "" },
          };
        }
        currentUser = (data as SignResponse).user;
        return {
          success: true,
          user: currentUser,
          session: { userId: currentUser.id, expiresAt: "" },
        };
      } catch (err) {
        return { success: false, reason: toReason(err) };
      }
    },

    async signUp(input): Promise<AuthResult> {
      try {
        const data = await http.post<SignResponse>("auth/signup", input);
        currentUser = data.user;
        return {
          success: true,
          user: currentUser,
          session: { userId: currentUser.id, expiresAt: "" },
        };
      } catch (err) {
        return { success: false, reason: toReason(err) };
      }
    },

    async signOut(): Promise<void> {
      try {
        await http.post("auth/signout");
      } finally {
        currentUser = null;
      }
    },

    async getCurrentUser(): Promise<User | null> {
      return currentUser;
    },

    async refresh(): Promise<Session | null> {
      try {
        const data = await http.post<SignResponse>("auth/refresh");
        currentUser = data.user;
        return { userId: currentUser.id, expiresAt: "" };
      } catch {
        return null;
      }
    },
  };
}
