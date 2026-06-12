import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
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

const SessionSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  expiresAt: z.string(),
  orgId: z.string().nullable(),
  current: z.boolean(),
});

const SessionListSchema = z.object({
  sessions: z.array(SessionSchema),
});

export type SessionItem = z.infer<typeof SessionSchema>;

export const accountQueries = {
  me: () =>
    queryOptions({
      queryKey: ["auth", "me"],
      queryFn: () => httpClient.get("/auth/me", { schema: MeSchema, requiresAuth: true }),
      staleTime: 60_000,
    }),
};

export const sessionQueries = {
  list: () =>
    queryOptions({
      queryKey: ["auth", "sessions"],
      queryFn: () =>
        httpClient.get("/auth/sessions", { schema: SessionListSchema, requiresAuth: true }),
      staleTime: 30_000,
    }),
};

export function useRevokeSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => httpClient.delete(`/auth/sessions/${id}`, { requiresAuth: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["auth", "sessions"] }),
  });
}

export function useRevokeOtherSessions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => httpClient.delete("/auth/sessions", { requiresAuth: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["auth", "sessions"] }),
  });
}
