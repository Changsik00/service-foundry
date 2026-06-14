import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

import { httpClient } from "@/lib/http-client";

const AdminOrgSchema = z.object({
  orgs: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      slug: z.string(),
      isPersonal: z.boolean(),
      ownerId: z.string(),
      createdAt: z.string(),
    }),
  ),
  nextCursor: z.string().nullable(),
});

const AdminUserSchema = z.object({
  users: z.array(
    z.object({
      id: z.string(),
      email: z.string(),
      displayName: z.string().nullable(),
      role: z.string(),
      orgId: z.string().nullable(),
      createdAt: z.string(),
    }),
  ),
  nextCursor: z.string().nullable(),
});

export interface AdminQueryParams {
  search?: string;
  cursor?: string;
  limit?: number;
}

export const adminQueries = {
  orgs: (params: AdminQueryParams = {}) =>
    queryOptions({
      queryKey: ["admin", "orgs", params],
      queryFn: () => {
        const searchParams = new URLSearchParams();
        if (params.search) searchParams.set("search", params.search);
        if (params.cursor) searchParams.set("cursor", params.cursor);
        if (params.limit) searchParams.set("limit", String(params.limit));
        const qs = searchParams.toString();
        const path = qs ? `/admin/orgs?${qs}` : "/admin/orgs";
        return httpClient.get(path, { schema: AdminOrgSchema, requiresAuth: true });
      },
    }),
  users: (params: AdminQueryParams = {}) =>
    queryOptions({
      queryKey: ["admin", "users", params],
      queryFn: () => {
        const searchParams = new URLSearchParams();
        if (params.search) searchParams.set("search", params.search);
        if (params.cursor) searchParams.set("cursor", params.cursor);
        if (params.limit) searchParams.set("limit", String(params.limit));
        const qs = searchParams.toString();
        const path = qs ? `/admin/users?${qs}` : "/admin/users";
        return httpClient.get(path, { schema: AdminUserSchema, requiresAuth: true });
      },
    }),
};

const FeatureFlagSchema = z.object({
  id: z.string(),
  key: z.string(),
  description: z.string().nullable(),
  enabled: z.boolean(),
  createdAt: z.string(),
});

const FeatureFlagListSchema = z.array(FeatureFlagSchema);

export const featureFlagQueries = {
  list: () =>
    queryOptions({
      queryKey: ["admin", "feature-flags"],
      queryFn: () =>
        httpClient.get("/admin/feature-flags", {
          schema: FeatureFlagListSchema,
          requiresAuth: true,
        }),
    }),
  createFn: (body: { key: string; description?: string }) =>
    httpClient.post("/admin/feature-flags", body, {
      schema: FeatureFlagSchema,
      requiresAuth: true,
    }),
  updateFn: (key: string, enabled: boolean) =>
    httpClient.patch(
      `/admin/feature-flags/${key}`,
      { enabled },
      {
        schema: FeatureFlagSchema,
        requiresAuth: true,
      },
    ),
  removeFn: (key: string) =>
    httpClient.delete(`/admin/feature-flags/${key}`, { requiresAuth: true }),
};

export type AdminOrg = z.output<typeof AdminOrgSchema>["orgs"][number];
export type AdminUser = z.output<typeof AdminUserSchema>["users"][number];
export type AdminFeatureFlag = z.output<typeof FeatureFlagSchema>;
