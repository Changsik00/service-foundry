import type { User } from "@repo/auth-contracts";
import { createHttpClient, type HttpClient } from "@repo/frontend-http-client";

// ── 응답 타입 ─────────────────────────────────────────────────────────────────
export type SignResponse = { accessToken: string; user: User };
export type SignInResponse = SignResponse | { status: "mfa_required" };

// ── API factory ───────────────────────────────────────────────────────────────
// HTTP 메서드·경로·payload 포맷을 여기서만 관리.
// 호출자는 signIn(input) 만 알면 되고, POST/body/path 는 알 필요 없음.
export const createAuthApi = (http: HttpClient) => ({
  signIn: (input: unknown) => http.post<SignInResponse>("auth/signin", input),
  signUp: (input: unknown) => http.post<SignResponse>("auth/signup", input),
  signOut: () => http.post("auth/signout"),
  refresh: () => http.post<SignResponse>("auth/refresh"),
});

export type AuthApi = ReturnType<typeof createAuthApi>;

export const buildAuthApi = (baseUrl: string): AuthApi =>
  createAuthApi(createHttpClient({ baseUrl, credentials: "include" }));
