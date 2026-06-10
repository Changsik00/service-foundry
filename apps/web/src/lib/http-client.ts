"use client";

import { createHttpClient } from "@repo/frontend-http-client";

import { source } from "./supabase-auth";

/**
 * apps/web 의 *client-side* HTTP client singleton.
 *
 * - **client component** 만 사용 (`useHealthQuery` 등). `NEXT_PUBLIC_` env 박음 (client bundle 노출 OK)
 * - RSC (`page.tsx`) 는 별도로 `createHttpClient` 호출 — `API_BASE_URL` (server-only) 박음
 * - `auth: source` 역주입 — Supabase 토큰 자동 주입 + 401 refresh 재시도 활성화
 *
 * 본 패턴 *분리* 이유: dev 시 동일 URL, prod 시 server (docker internal) vs client (public) 분리 가능.
 */
const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export const httpClient = createHttpClient({ baseUrl, auth: source });
