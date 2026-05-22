"use client";

import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { z } from "zod";

import { httpClient } from "./http-client";

export const HealthSchema = z.object({
  status: z.string(),
  uptime: z.number(),
  version: z.string(),
});

export type HealthResponse = z.infer<typeof HealthSchema>;

/**
 * `useHealthQuery` — `apps/api` 의 `/health` 호출 client query.
 *
 * web-vite 의 답습. *client component* 안에서만 사용.
 */
export function useHealthQuery(): UseQueryResult<HealthResponse> {
  return useQuery<HealthResponse>({
    queryKey: ["health"],
    queryFn: () => httpClient.get<HealthResponse>("/health", { schema: HealthSchema }),
  });
}
