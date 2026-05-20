/**
 * @repo/frontend-http-client — ky 기반 typed HTTP client for cross-env frontend.
 *
 * - `createHttpClient(options)` factory — `ky` 기반, retry/timeout/hooks 옵션 노출
 * - `HttpClient` interface — backend-http-client 와 동일 API surface (request/get/post/put/delete/patch)
 * - `AppError` 변환 (NETWORK / TIMEOUT / UPSTREAM / BAD_REQUEST / VALIDATION) — `@repo/errors` 답습
 * - explicit zod schema binding (`schema?: ZodType<T>`) — 호출자가 `@repo/contracts` 의 schema 명시
 *
 * 본 패키지는 ADR-0015 (framework-adapter naming) + ADR-0009 (AppError) 답습.
 * `reqId propagation` 은 frontend 환경 한계 (AsyncLocalStorage 없음) — 호출자가 `headers` 명시.
 *
 * 환경 지원: Next Server/Client Component, Vite SPA, Edge runtime (모두 globalThis.fetch 기반).
 */
import { AppError } from "@repo/errors";
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

function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;
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
  });

  const request = async <T>(opts: HttpRequestOptions<T>): Promise<T> => {
    const methodLower = opts.method.toLowerCase();
    // POST/PATCH 도 retries 명시 박힌 경우 retry 허용
    const explicitRetries = opts.retries !== undefined;
    const allowedMethods: string[] = explicitRetries
      ? Array.from(new Set([...IDEMPOTENT_METHODS, methodLower]))
      : [...IDEMPOTENT_METHODS];

    const kyOpts: Options = {
      method: opts.method,
      ...(opts.headers && { headers: opts.headers }),
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
