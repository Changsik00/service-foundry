import type { AuthResult, CoreAuthSDK, User } from "@repo/auth-contracts";
import { AppError } from "@repo/errors";
import { createHttpClient, type HttpClient } from "@repo/frontend-http-client";

// ── 1. API 응답 타입 ──────────────────────────────────────────────────────────
type SignResponse = { accessToken: string; user: User };
type SignInResponse = SignResponse | { status: "mfa_required" };

// ── 2. API layer: endpoint 정의만 ─────────────────────────────────────────────
const buildApi = (http: HttpClient) => ({
  signIn: (input: unknown) => http.post<SignInResponse>("auth/signin", input),
  signUp: (input: unknown) => http.post<SignResponse>("auth/signup", input),
  signOut: () => http.post("auth/signout"),
  refresh: () => http.post<SignResponse>("auth/refresh"),
});

// ── 3. Result 타입 + 래퍼 ─────────────────────────────────────────────────────
// try/catch를 값으로 표현 — 알려진 에러를 예외가 아닌 데이터로 처리
type Ok<T> = { ok: true; data: T };
type Err = { ok: false; err: unknown };

const tryRequest = <T>(fn: () => Promise<T>): Promise<Ok<T> | Err> =>
  fn().then(
    (data) => ({ ok: true as const, data }),
    (err) => ({ ok: false as const, err }),
  );

// ── 4. 변환 헬퍼 ─────────────────────────────────────────────────────────────
const toReason = (err: unknown): "invalid_credentials" | "rate_limited" =>
  err instanceof AppError && err.statusCode === 429 ? "rate_limited" : "invalid_credentials";

const toSuccess = (user: User): Extract<AuthResult, { success: true }> => ({
  success: true,
  user,
  session: { userId: user.id, expiresAt: "" },
});

// ── 5. SDK factory ────────────────────────────────────────────────────────────
export function createHttpAuthSDK(baseUrl: string): CoreAuthSDK {
  const api = buildApi(createHttpClient({ baseUrl, credentials: "include" }));
  let currentUser: User | null = null;

  // currentUser 갱신 + success AuthResult 반환
  const storeAndSucceed = (user: User): AuthResult => {
    currentUser = user;
    return toSuccess(user);
  };

  // signIn / signUp 공통: 호출 결과 → AuthResult (성공 시 currentUser 갱신)
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
