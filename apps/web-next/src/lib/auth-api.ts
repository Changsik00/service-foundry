import { User } from "@repo/auth-contracts";
import { createHttpClient, type HttpClient } from "@repo/frontend-http-client";
import { z } from "zod";

// ── 응답 스키마 ───────────────────────────────────────────────────────────────
const SignResponseSchema = z.object({ accessToken: z.string(), user: User });
const SignInResponseSchema = z.union([
  SignResponseSchema,
  z.object({ status: z.literal("mfa_required") }),
]);

export type SignResponse = z.output<typeof SignResponseSchema>;
export type SignInResponse = z.output<typeof SignInResponseSchema>;

// ── API factory ───────────────────────────────────────────────────────────────
// HTTP 메서드·경로·payload 포맷을 여기서만 관리.
// 호출자는 signIn(input) 만 알면 되고, POST/body/path 는 알 필요 없음.
export const createAuthApi = (http: HttpClient) => ({
  signIn: (input: unknown) =>
    http.post<SignInResponse>("auth/signin", input, { schema: SignInResponseSchema }),
  signUp: (input: unknown) =>
    http.post<SignResponse>("auth/signup", input, { schema: SignResponseSchema }),
  signOut: () => http.post("auth/signout"),
  refresh: () => http.post<SignResponse>("auth/refresh", undefined, { schema: SignResponseSchema }),
});

export type AuthApi = ReturnType<typeof createAuthApi>;

export const buildAuthApi = (baseUrl: string): AuthApi =>
  createAuthApi(createHttpClient({ baseUrl, credentials: "include" }));
