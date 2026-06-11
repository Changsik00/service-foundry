import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { httpClient } from "@/lib/http-client";

const SwitchResultSchema = z.object({ orgId: z.string() });

/** org 전환 — 토큰 불변(ADR-0026)이므로 org 스코프 데이터 전부 무효화가 정확한 갱신 */
export function useSwitchOrg() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orgId: string) =>
      httpClient.post(
        "/auth/org/switch",
        { orgId },
        { schema: SwitchResultSchema, requiresAuth: true },
      ),
    onSuccess: () => queryClient.invalidateQueries(),
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; role: "admin" | "member" }) =>
      httpClient.post("/auth/org/invite", input, { requiresAuth: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orgs", "members"] }),
  });
}

export function useAcceptInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (token: string) =>
      httpClient.post(
        "/auth/org/invite/accept",
        { token },
        { schema: SwitchResultSchema, requiresAuth: true },
      ),
    onSuccess: () => queryClient.invalidateQueries(),
  });
}
