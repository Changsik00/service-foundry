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

export const createHttpClient = (options: CreateHttpClientOptions): HttpClient => {
  const { baseUrl, headers: defaultHeaders = {} } = options;

  const request = async <T>(opts: HttpRequestOptions): Promise<T> => {
    const url = `${baseUrl}${opts.path}`;
    const headers: Record<string, string> = {
      "content-type": "application/json",
      accept: "application/json",
      ...defaultHeaders,
      ...(opts.headers ?? {}),
    };

    const response = await fetch(url, {
      method: opts.method,
      headers,
      ...(opts.body !== undefined && { body: JSON.stringify(opts.body) }),
    });

    return (await response.json()) as T;
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
