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
 * stub — TDD Green 단계에서 구현.
 */
export function useHealthQuery(): UseQueryResult<HealthResponse> {
  return useQuery<HealthResponse>({
    queryKey: ["health"],
    queryFn: () => {
      throw new Error("not implemented");
    },
  });
}
