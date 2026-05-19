import { AppError } from "@repo/errors";
import { fetch } from "undici";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD";

export interface CreateHttpClientOptions {
  baseUrl: string;
  timeoutMs?: number;
  retries?: number;
  retryBackoffMs?: number;
  headers?: Record<string, string>;
}

export interface HttpRequestOptions {
  method: HttpMethod;
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
  retries?: number;
  timeoutMs?: number;
}

export interface HttpClient {
  request<T>(opts: HttpRequestOptions): Promise<T>;
  get<T>(path: string, opts?: Partial<HttpRequestOptions>): Promise<T>;
  post<T>(path: string, body?: unknown, opts?: Partial<HttpRequestOptions>): Promise<T>;
  put<T>(path: string, body?: unknown, opts?: Partial<HttpRequestOptions>): Promise<T>;
  delete<T>(path: string, opts?: Partial<HttpRequestOptions>): Promise<T>;
  patch<T>(path: string, body?: unknown, opts?: Partial<HttpRequestOptions>): Promise<T>;
}

const IDEMPOTENT_METHODS: ReadonlySet<HttpMethod> = new Set(["GET", "PUT", "DELETE", "HEAD"]);

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_RETRIES = 3;
const DEFAULT_BACKOFF_MS = 100;

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const isAbortError = (err: unknown): boolean =>
  typeof err === "object" && err !== null && (err as { name?: string }).name === "AbortError";

export const createHttpClient = (options: CreateHttpClientOptions): HttpClient => {
  const { baseUrl, headers: defaultHeaders = {} } = options;
  const baseRetries = options.retries ?? DEFAULT_RETRIES;
  const baseBackoff = options.retryBackoffMs ?? DEFAULT_BACKOFF_MS;
  const baseTimeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const request = async <T>(opts: HttpRequestOptions): Promise<T> => {
    const url = `${baseUrl}${opts.path}`;
    const headers: Record<string, string> = {
      "content-type": "application/json",
      accept: "application/json",
      ...defaultHeaders,
      ...(opts.headers ?? {}),
    };

    const maxRetries = opts.retries ?? baseRetries;
    const timeoutMs = opts.timeoutMs ?? baseTimeoutMs;
    // POST/PATCH: opts.retries 명시 안 했으면 retry 안 함 (idempotent safety)
    const explicitRetries = opts.retries !== undefined;
    const canRetry = IDEMPOTENT_METHODS.has(opts.method) || explicitRetries;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(url, {
          method: opts.method,
          headers,
          signal: controller.signal,
          ...(opts.body !== undefined && { body: JSON.stringify(opts.body) }),
        });
        clearTimeout(timer);

        if (response.status >= 500) {
          if (canRetry && attempt < maxRetries) {
            await sleep(baseBackoff * 2 ** attempt);
            continue;
          }
          throw new AppError({
            code: "UPSTREAM",
            message: `Upstream ${response.status}: ${opts.method} ${opts.path}`,
            statusCode: response.status,
          });
        }

        if (response.status >= 400) {
          throw new AppError({
            code: "BAD_REQUEST",
            message: `Client ${response.status}: ${opts.method} ${opts.path}`,
            statusCode: response.status,
          });
        }

        return (await response.json()) as T;
      } catch (err) {
        clearTimeout(timer);

        if (err instanceof AppError) {
          throw err;
        }

        if (isAbortError(err)) {
          throw new AppError({
            code: "TIMEOUT",
            message: `Request timeout ${timeoutMs}ms: ${opts.method} ${opts.path}`,
            statusCode: 504,
            cause: err,
          });
        }

        if (canRetry && attempt < maxRetries) {
          await sleep(baseBackoff * 2 ** attempt);
          continue;
        }

        throw new AppError({
          code: "NETWORK",
          message: `Network error: ${opts.method} ${opts.path}`,
          statusCode: 0,
          cause: err,
        });
      }
    }

    // Unreachable — for loop는 throw 또는 return으로 끝
    throw new AppError({
      code: "INTERNAL",
      message: "http-client: unexpected loop exit",
      statusCode: 500,
    });
  };

  return {
    request,
    get: <T>(path: string, opts?: Partial<HttpRequestOptions>) =>
      request<T>({ ...opts, method: "GET", path }),
    post: <T>(path: string, body?: unknown, opts?: Partial<HttpRequestOptions>) =>
      request<T>({ ...opts, method: "POST", path, body }),
    put: <T>(path: string, body?: unknown, opts?: Partial<HttpRequestOptions>) =>
      request<T>({ ...opts, method: "PUT", path, body }),
    delete: <T>(path: string, opts?: Partial<HttpRequestOptions>) =>
      request<T>({ ...opts, method: "DELETE", path }),
    patch: <T>(path: string, body?: unknown, opts?: Partial<HttpRequestOptions>) =>
      request<T>({ ...opts, method: "PATCH", path, body }),
  };
};
