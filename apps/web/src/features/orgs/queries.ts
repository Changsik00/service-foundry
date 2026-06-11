import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

import { httpClient } from "@/lib/http-client";

const OrgsSchema = z.object({
  orgs: z.array(
    z.object({
      orgId: z.string(),
      name: z.string(),
      role: z.string(),
      isPersonal: z.boolean(),
    }),
  ),
});

const MembersSchema = z.object({
  members: z.array(
    z.object({
      userId: z.string(),
      orgId: z.string(),
      role: z.string(),
      email: z.string(),
    }),
  ),
});

export const orgQueries = {
  list: () =>
    queryOptions({
      queryKey: ["orgs", "list"],
      queryFn: () => httpClient.get("/auth/orgs", { schema: OrgsSchema, requiresAuth: true }),
      staleTime: 60_000,
    }),
  members: () =>
    queryOptions({
      // active org 스코프 — 전환 시 전체 invalidate 로 갱신 (ADR-0026)
      queryKey: ["orgs", "members"],
      queryFn: () =>
        httpClient.get("/auth/org/members", { schema: MembersSchema, requiresAuth: true }),
    }),
};
