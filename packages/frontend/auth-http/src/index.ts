import type { AuthResult, CoreAuthSDK, Session, User } from "@repo/auth-contracts";

type SignResponse = { accessToken: string; user: User };
type SignInResponse = SignResponse | { status: "mfa_required" };

function httpReason(err: unknown): "invalid_credentials" | "rate_limited" {
  const status = (err as { status?: number }).status;
  if (status === 429) return "rate_limited";
  return "invalid_credentials";
}

async function post<T>(baseUrl: string, path: string, body?: unknown): Promise<T> {
  const init: RequestInit = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  };
  if (body !== undefined) init.body = JSON.stringify(body);
  const res = await fetch(`${baseUrl}/${path}`, init);
  if (!res.ok) throw Object.assign(new Error(String(res.status)), { status: res.status });
  return res.json() as Promise<T>;
}

export function createHttpAuthSDK(baseUrl: string): CoreAuthSDK {
  let currentUser: User | null = null;

  return {
    async signIn(input): Promise<AuthResult> {
      try {
        const data = await post<SignInResponse>(baseUrl, "auth/signin", input);
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
        return { success: false, reason: httpReason(err) };
      }
    },

    async signUp(input): Promise<AuthResult> {
      try {
        const data = await post<SignResponse>(baseUrl, "auth/signup", input);
        currentUser = data.user;
        return {
          success: true,
          user: currentUser,
          session: { userId: currentUser.id, expiresAt: "" },
        };
      } catch (err) {
        return { success: false, reason: httpReason(err) };
      }
    },

    async signOut(): Promise<void> {
      try {
        await post(baseUrl, "auth/signout");
      } finally {
        currentUser = null;
      }
    },

    async getCurrentUser(): Promise<User | null> {
      return currentUser;
    },

    async refresh(): Promise<Session | null> {
      try {
        const data = await post<SignResponse>(baseUrl, "auth/refresh");
        currentUser = data.user;
        return { userId: currentUser.id, expiresAt: "" };
      } catch {
        return null;
      }
    },
  };
}
