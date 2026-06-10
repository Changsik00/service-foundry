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
  /** fetch credentials 모드 — cross-origin cookie 전송 시 "include" */
  credentials?: RequestCredentials;
  /** 401 수신 시 호출 — 통상 sdk.refresh(). throw 시 재시도 없이 401 전파 */
  onUnauthorized?: () => Promise<void>;
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
  const { onUnauthorized } = options;

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

    const attempt = async (): Promise<T> => {
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

    try {
      return await attempt();
    } catch (e) {
      if (e instanceof AppError && e.statusCode === 401 && onUnauthorized) {
        try {
          await onUnauthorized();
        } catch {
          throw e; // refresh 실패 → 원래 401 AppError 전파
        }
        return await attempt(); // 1회 재시도
      }
      throw e;
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
