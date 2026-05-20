"use client";

import { createHttpClient } from "@repo/frontend-http-client";

/**
 * apps/web-next 의 *client-side* HTTP client singleton.
 *
 * - **client component** 만 사용 (`useHealthQuery` 등). `NEXT_PUBLIC_` env 박음 (client bundle 노출 OK)
 * - RSC (`page.tsx`) 는 별도로 `createHttpClient` 호출 — `API_BASE_URL` (server-only) 박음
 *
 * 본 패턴 *분리* 이유: dev 시 동일 URL, prod 시 server (docker internal) vs client (public) 분리 가능.
 */
const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export const httpClient = createHttpClient({ baseUrl });
