import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

import { httpClient } from "@/lib/http-client";

// GET /auth/me — apps/api ProviderMeController 응답 계약
const MeSchema = z.object({
  user: z.object({
    sub: z.string(),
    role: z.string(),
    orgId: z.string().nullable(),
  }),
});

export type Me = z.infer<typeof MeSchema>;

export const accountQueries = {
  me: () =>
    queryOptions({
      queryKey: ["auth", "me"],
      queryFn: () => httpClient.get("/auth/me", { schema: MeSchema, requiresAuth: true }),
      staleTime: 60_000,
    }),
};
