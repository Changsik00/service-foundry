import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { z } from "zod";

import { httpClient } from "./http-client.js";

export const HealthSchema = z.object({
  status: z.string(),
  uptime: z.number(),
  version: z.string(),
});

export type HealthResponse = z.infer<typeof HealthSchema>;

/**
 * `useHealthQuery` — `apps/api` 의 `/health` 호출 client query.
 *
 * - `queryKey: ['health']`
 * - `queryFn`: `httpClient.get("/health", { schema: HealthSchema })`
 * - retry / cache / refetch 는 QueryClient default 따름 (main.tsx)
 */
export function useHealthQuery(): UseQueryResult<HealthResponse> {
  return useQuery<HealthResponse>({
    queryKey: ["health"],
    queryFn: () => httpClient.get<HealthResponse>("/health", { schema: HealthSchema }),
  });
}
