import { User } from "@repo/auth-contracts";
import { createHttpClient, type HttpClient } from "@repo/frontend-http-client";
import { z } from "zod";

// ── 응답 스키마 ───────────────────────────────────────────────────────────────
const SignResponseSchema = z.object({
  accessToken: z.string(),
  user: User,
  csrfToken: z.string(),
});
const SignInResponseSchema = z.union([
  SignResponseSchema,
  z.object({ status: z.literal("mfa_required") }),
]);
const CsrfResponseSchema = z.object({ csrfToken: z.string() });

export type SignResponse = z.output<typeof SignResponseSchema>;
export type SignInResponse = z.output<typeof SignInResponseSchema>;

// ── API factory ───────────────────────────────────────────────────────────────
// HTTP 메서드·경로·payload 포맷을 여기서만 관리.
// CSRF(spec-15-02): 보호된 POST 는 GET /auth/csrf 로 받은 토큰을 X-Csrf-Token 헤더로 동반.
// signin/signup/refresh 응답의 새 csrfToken 으로 갱신(rotate)한다.
export const createAuthApi = (http: HttpClient) => {
  let csrfToken: string | undefined;

  const fetchCsrf = async (): Promise<string> => {
    const res = await http.get<z.output<typeof CsrfResponseSchema>>("auth/csrf", {
      schema: CsrfResponseSchema,
    });
    csrfToken = res.csrfToken;
    return res.csrfToken;
  };

  const ensureCsrf = async (): Promise<void> => {
    if (!csrfToken) await fetchCsrf();
  };

  const csrfOpts = <T>(extra?: { schema?: z.ZodType<T> }) => ({
    ...extra,
    headers: csrfToken ? { "X-Csrf-Token": csrfToken } : {},
  });

  const remember = <T>(res: T): T => {
    if (res && typeof res === "object" && "csrfToken" in res) {
      const t = (res as { csrfToken?: unknown }).csrfToken;
      if (typeof t === "string") csrfToken = t;
    }
    return res;
  };

  // CSRF 403 식별 — http-client 가 비-2xx 를 AppError(statusCode 포함)로 throw (결합 회피 위해 덕타이핑).
  const is403 = (e: unknown): boolean =>
    !!e && typeof e === "object" && (e as { statusCode?: number }).statusCode === 403;

  /**
   * 보호 POST 자가복구 (spec-16-03 W6): 403(토큰 만료/불일치)이면 csrf 재발급 후 **1회만** 재시도.
   * 재시도는 recursion 없이 1회 — 재시도도 403 이면 원 에러를 throw (무한 재발급 방지).
   */
  const withCsrfRetry = async <T>(run: () => Promise<T>): Promise<T> => {
    await ensureCsrf();
    try {
      return remember(await run());
    } catch (e) {
      if (!is403(e)) throw e;
      await fetchCsrf();
      return remember(await run());
    }
  };

  return {
    fetchCsrf,
    signIn: (input: unknown): Promise<SignInResponse> =>
      withCsrfRetry(() =>
        http.post<SignInResponse>("auth/signin", input, csrfOpts({ schema: SignInResponseSchema })),
      ),
    signUp: (input: unknown): Promise<SignResponse> =>
      withCsrfRetry(() =>
        http.post<SignResponse>("auth/signup", input, csrfOpts({ schema: SignResponseSchema })),
      ),
    signOut: () => withCsrfRetry(() => http.post("auth/signout", undefined, csrfOpts())),
    refresh: (): Promise<SignResponse> =>
      withCsrfRetry(() =>
        http.post<SignResponse>(
          "auth/refresh",
          undefined,
          csrfOpts({ schema: SignResponseSchema }),
        ),
      ),
  };
};

export type AuthApi = ReturnType<typeof createAuthApi>;

export const buildAuthApi = (baseUrl: string): AuthApi =>
  createAuthApi(createHttpClient({ baseUrl, credentials: "include" }));
