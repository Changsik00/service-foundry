/**
 * @repo/frontend-sdk — typed API client for cross-env frontend (Next Server/Client, Vite SPA, Edge).
 *
 * - `createSdk(options)` factory — `ky` 기반, retry/timeout/hooks 옵션 노출
 * - `Sdk` interface — backend-http-client 와 동일 API surface (request/get/post/put/delete/patch)
 * - `AppError` 변환 (NETWORK / TIMEOUT / UPSTREAM / BAD_REQUEST / VALIDATION) — `@repo/errors` 답습
 * - explicit zod schema binding (`schema?: ZodType<T>`) — 호출자가 `@repo/contracts` 의 schema 명시
 *
 * 본 패키지는 ADR-0015 (framework-adapter naming) + ADR-0009 (AppError) 답습.
 * `reqId propagation` 은 frontend 환경 한계 (AsyncLocalStorage 없음) — 호출자가 `headers` 명시.
 */
import type { ZodType } from "zod";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD";

export interface CreateSdkOptions {
  baseUrl: string;
  timeoutMs?: number;
  retries?: number;
  retryBackoffMs?: number;
  headers?: Record<string, string>;
}

export interface SdkRequestOptions<TOutput = unknown> {
  method: HttpMethod;
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
  retries?: number;
  timeoutMs?: number;
  schema?: ZodType<TOutput>;
}

export interface Sdk {
  request<T>(opts: SdkRequestOptions<T>): Promise<T>;
  get<T>(path: string, opts?: Partial<SdkRequestOptions<T>>): Promise<T>;
  post<T>(path: string, body?: unknown, opts?: Partial<SdkRequestOptions<T>>): Promise<T>;
  put<T>(path: string, body?: unknown, opts?: Partial<SdkRequestOptions<T>>): Promise<T>;
  delete<T>(path: string, opts?: Partial<SdkRequestOptions<T>>): Promise<T>;
  patch<T>(path: string, body?: unknown, opts?: Partial<SdkRequestOptions<T>>): Promise<T>;
}

export const createSdk = (_options: CreateSdkOptions): Sdk => {
  // stub — TDD Green 단계에서 구현
  throw new Error("not implemented");
};
