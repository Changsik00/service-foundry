/**
 * @repo/frontend-http-client — ky 기반 typed HTTP client for cross-env frontend.
 *
 * - `createHttpClient(options)` factory — `ky` 기반, retry/timeout/hooks 옵션 노출
 * - `HttpClient` interface — backend-http-client 와 동일 API surface (request/get/post/put/delete/patch)
 * - `AppError` 변환 (NETWORK / TIMEOUT / UPSTREAM / BAD_REQUEST / VALIDATION) — `@repo/errors` 답습
 * - explicit zod schema binding (`schema?: ZodType<T>`) — 호출자가 `@repo/contracts` 의 schema 명시
 * - `auth?: AuthSource` 역주입 — 토큰 자동 주입 + requiresAuth blocking + 401 refresh 재시도
 *   - `requiresAuth: true` 요청만 `waitUntilSettled()` 대기 (public은 SDK 초기화 전에도 즉시 진행)
 *   - 401 시 `auth.refresh()` → 새 토큰으로 1회 재시도 (무한 루프 없음: attempt는 request 비재귀)
 *
 * 본 패키지는 ADR-0015 (framework-adapter naming) + ADR-0009 (AppError) 답습.
 * `reqId propagation` 은 frontend 환경 한계 (AsyncLocalStorage 없음) — 호출자가 `headers` 명시.
 *
 * 환경 지원: Next Server/Client Component, Vite SPA, Edge runtime (모두 globalThis.fetch 기반).
 */
import type { AuthSource } from "@repo/auth-contracts";
import { AppError, isAppError, unauthenticatedError } from "@repo/errors";
import ky, { HTTPError, type KyInstance, type Options, TimeoutError } from "ky";
import type { ZodType } from "zod";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD";

export interface CreateHttpClientOptions {
  baseUrl: string;
  /** ky timeout ms — default 10_000 */
  timeoutMs?: number;
  /** ky retry.limit — default 3 */
  retries?: number;
  /** ky retry.delay base — default 100 */
  retryBackoffMs?: number;
  /** default headers (모든 요청) */
  headers?: Record<string, string>;
  /** fetch credentials 모드 — cross-origin cookie 전송 시 "include" */
  credentials?: RequestCredentials;
  /** 인증 소스 — 주입 시 토큰 자동 주입 + 401 refresh 재시도 활성화 */
  auth?: AuthSource;
}

export interface HttpRequestOptions<TOutput = unknown> {
  method: HttpMethod;
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
  /**
   * `opts.retries` 박힌 경우 — *해당 method 도 retry 허용*.
   * default — POST/PATCH 는 retry 안 함 (idempotency safety, backend-http-client 정책 답습).
   */
  retries?: number;
  /** 요청별 timeout override */
  timeoutMs?: number;
  /** runtime 검증 — 박혔으면 `parse()`, fail → AppError(VALIDATION) */
  schema?: ZodType<TOutput>;
  /** true이면 unauthenticated 상태에서 즉시 AppError(401) — fetch 없음 */
  requiresAuth?: boolean;
}

export interface HttpClient {
  request<T>(opts: HttpRequestOptions<T>): Promise<T>;
  get<T>(path: string, opts?: Partial<HttpRequestOptions<T>>): Promise<T>;
  post<T>(path: string, body?: unknown, opts?: Partial<HttpRequestOptions<T>>): Promise<T>;
  put<T>(path: string, body?: unknown, opts?: Partial<HttpRequestOptions<T>>): Promise<T>;
  delete<T>(path: string, opts?: Partial<HttpRequestOptions<T>>): Promise<T>;
  patch<T>(path: string, body?: unknown, opts?: Partial<HttpRequestOptions<T>>): Promise<T>;
}

const IDEMPOTENT_METHODS = ["get", "put", "delete", "head", "options", "trace"] as const;
const RETRY_STATUS_CODES = [408, 413, 429, 500, 502, 503, 504];

const isUnauthorized = (e: unknown): e is AppError => isAppError(e) && e.statusCode === 401;

function toAppError(err: unknown): AppError {
  if (isAppError(err)) return err;
  if (err instanceof TimeoutError) {
    return new AppError({ code: "TIMEOUT", message: err.message, statusCode: 504 });
  }
  if (err instanceof HTTPError) {
    const status = err.response.status;
    return new AppError({
      code: status >= 500 ? "UPSTREAM" : "BAD_REQUEST",
      message: `${status} ${err.message}`,
      statusCode: status,
    });
  }
  return new AppError({
    code: "NETWORK",
    message: err instanceof Error ? err.message : String(err),
    statusCode: 0,
  });
}

export const createHttpClient = (options: CreateHttpClientOptions): HttpClient => {
  const { auth } = options;

  const baseInstance: KyInstance = ky.create({
    baseUrl: options.baseUrl.replace(/\/$/, ""),
    timeout: options.timeoutMs ?? 10_000,
    retry: {
      limit: options.retries ?? 3,
      methods: [...IDEMPOTENT_METHODS],
      statusCodes: RETRY_STATUS_CODES,
      backoffLimit: 30_000,
    },
    ...(options.headers && { headers: options.headers }),
    ...(options.credentials && { credentials: options.credentials }),
  });

  const request = async <T>(opts: HttpRequestOptions<T>): Promise<T> => {
    // 1. protected 요청만 settled 대기 — public은 unknown이어도 즉시 진행
    if (auth && opts.requiresAuth) await auth.waitUntilSettled();

    // 2. requiresAuth + unauthenticated → 즉시 거부 (fetch 없음)
    if (opts.requiresAuth && auth?.status === "unauthenticated") {
      throw unauthenticatedError("인증 필요");
    }

    const methodLower = opts.method.toLowerCase();
    const explicitRetries = opts.retries !== undefined;
    const allowedMethods: string[] = explicitRetries
      ? Array.from(new Set([...IDEMPOTENT_METHODS, methodLower]))
      : [...IDEMPOTENT_METHODS];

    const baseKyOpts: Options = {
      method: opts.method,
      ...(opts.body !== undefined && { json: opts.body }),
      ...(opts.timeoutMs !== undefined && { timeout: opts.timeoutMs }),
      retry: {
        limit: opts.retries ?? options.retries ?? 3,
        methods: allowedMethods,
        statusCodes: RETRY_STATUS_CODES,
        backoffLimit: 30_000,
      },
    };

    // ky 의 baseUrl + path — / 로 시작하면 안 됨, strip
    const normalizedPath = opts.path.replace(/^\//, "");

    // tok 은 attempt 마다 주입 — refresh 후 새 토큰으로 재시도 가능
    const attempt = async (tok: string | null): Promise<T> => {
      const kyOpts = {
        ...baseKyOpts,
        headers: {
          ...(tok ? { authorization: `Bearer ${tok}` } : {}),
          ...opts.headers,
        },
      };
      try {
        const raw = await baseInstance(normalizedPath, kyOpts).json<unknown>();
        if (opts.schema) {
          const parsed = opts.schema.safeParse(raw);
          if (!parsed.success) {
            throw new AppError({
              code: "VALIDATION",
              message: `Response schema validation failed: ${parsed.error.message}`,
              statusCode: 502,
            });
          }
          return parsed.data;
        }
        return raw as T;
      } catch (err) {
        throw toAppError(err);
      }
    };

    // 3. 첫 시도
    const token = auth ? await auth.getToken() : null;
    try {
      return await attempt(token);
    } catch (e) {
      // 4. 401 + 토큰 있었음 → refresh → 새 토큰으로 재시도 1회
      if (!isUnauthorized(e) || !auth || !token) throw e;
      try {
        await auth.refresh();
      } catch {
        throw e;
      }
      return await attempt(await auth.getToken());
    }
  };

  return {
    request,
    get: <T>(path: string, opts?: Partial<HttpRequestOptions<T>>) =>
      request<T>({ ...opts, method: "GET", path }),
    post: <T>(path: string, body?: unknown, opts?: Partial<HttpRequestOptions<T>>) =>
      request<T>({ ...opts, method: "POST", path, body }),
    put: <T>(path: string, body?: unknown, opts?: Partial<HttpRequestOptions<T>>) =>
      request<T>({ ...opts, method: "PUT", path, body }),
    delete: <T>(path: string, opts?: Partial<HttpRequestOptions<T>>) =>
      request<T>({ ...opts, method: "DELETE", path }),
    patch: <T>(path: string, body?: unknown, opts?: Partial<HttpRequestOptions<T>>) =>
      request<T>({ ...opts, method: "PATCH", path, body }),
  };
};

/**
 * 계약 기반 typed client (codegen 없는 "타입 추출").
 *
 * 엔드포인트 맵(`{ method, path, response: schema }`) 을 한 번 정의하면
 * 각 키에 대응하는 타입+런타임 검증된 메서드를 생성한다. `@repo/contracts` 의
 * zod 스키마를 `response` 로 그대로 사용 — drift 방지를 기존 `schema` 검증 위에 얹는다.
 */
export interface EndpointDef<Out = unknown> {
  method: HttpMethod;
  /** 엔드포인트 경로. path 파라미터는 호출 시 `opts.path` 로 override */
  path: string;
  /** 응답 검증 스키마 (`@repo/contracts`) */
  response: ZodType<Out>;
}

export interface ApiCallOptions {
  body?: unknown;
  headers?: Record<string, string>;
  /** 정의된 path 대신 사용할 경로 (path 파라미터 치환용) */
  path?: string;
}

export type ApiClient<E extends Record<string, EndpointDef>> = {
  [K in keyof E]: E[K] extends EndpointDef<infer O> ? (opts?: ApiCallOptions) => Promise<O> : never;
};

export function createApiClient<E extends Record<string, EndpointDef>>(
  http: HttpClient,
  endpoints: E,
): ApiClient<E> {
  const client = {} as Record<string, (opts?: ApiCallOptions) => Promise<unknown>>;
  for (const [name, def] of Object.entries(endpoints)) {
    client[name] = (opts?: ApiCallOptions) =>
      http.request({
        method: def.method,
        path: opts?.path ?? def.path,
        schema: def.response,
        ...(opts?.body !== undefined && { body: opts.body }),
        ...(opts?.headers && { headers: opts.headers }),
      });
  }
  return client as ApiClient<E>;
}
