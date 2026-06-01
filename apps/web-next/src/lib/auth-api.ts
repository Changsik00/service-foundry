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

  return {
    fetchCsrf,
    signIn: async (input: unknown): Promise<SignInResponse> => {
      await ensureCsrf();
      return remember(
        await http.post<SignInResponse>(
          "auth/signin",
          input,
          csrfOpts({ schema: SignInResponseSchema }),
        ),
      );
    },
    signUp: async (input: unknown): Promise<SignResponse> => {
      await ensureCsrf();
      return remember(
        await http.post<SignResponse>(
          "auth/signup",
          input,
          csrfOpts({ schema: SignResponseSchema }),
        ),
      );
    },
    signOut: async () => {
      await ensureCsrf();
      return http.post("auth/signout", undefined, csrfOpts());
    },
    refresh: async (): Promise<SignResponse> => {
      await ensureCsrf();
      return remember(
        await http.post<SignResponse>(
          "auth/refresh",
          undefined,
          csrfOpts({ schema: SignResponseSchema }),
        ),
      );
    },
  };
};

export type AuthApi = ReturnType<typeof createAuthApi>;

export const buildAuthApi = (baseUrl: string): AuthApi =>
  createAuthApi(createHttpClient({ baseUrl, credentials: "include" }));
