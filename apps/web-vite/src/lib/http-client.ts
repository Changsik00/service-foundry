import { createHttpClient } from "@repo/frontend-http-client";

const baseUrl = import.meta.env.VITE_API_BASE_URL;
if (!baseUrl) {
  throw new Error("VITE_API_BASE_URL is not defined");
}

/**
 * apps/web-vite 의 HTTP client singleton.
 * `useQuery` 의 queryFn 안에서 사용.
 */
export const httpClient = createHttpClient({ baseUrl });
