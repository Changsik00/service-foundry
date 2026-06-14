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
      displayName: z.string().nullable(),
    }),
  ),
  nextCursor: z.string().nullable(),
});

export interface MemberQueryParams {
  search?: string;
  role?: string;
  cursor?: string;
}

export const orgQueries = {
  list: () =>
    queryOptions({
      queryKey: ["orgs", "list"],
      queryFn: () => httpClient.get("/auth/orgs", { schema: OrgsSchema, requiresAuth: true }),
      staleTime: 60_000,
    }),
  members: (params: MemberQueryParams = {}) =>
    queryOptions({
      // active org 스코프 — 전환 시 전체 invalidate 로 갱신 (ADR-0026)
      queryKey: ["orgs", "members", params],
      queryFn: () => {
        const searchParams = new URLSearchParams();
        if (params.search) searchParams.set("search", params.search);
        if (params.role) searchParams.set("role", params.role);
        if (params.cursor) searchParams.set("cursor", params.cursor);
        const qs = searchParams.toString();
        const path = qs ? `/auth/org/members?${qs}` : "/auth/org/members";
        return httpClient.get(path, { schema: MembersSchema, requiresAuth: true });
      },
    }),
};
