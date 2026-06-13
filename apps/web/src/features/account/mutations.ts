import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { authSDK } from "@/lib/auth";
import { httpClient } from "@/lib/http-client";

export interface UpdateProfileVars {
  displayName: string;
}

export interface ChangePasswordVars {
  currentPassword: string;
  newPassword: string;
}

const CsrfSchema = z.object({ csrfToken: z.string() });

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: UpdateProfileVars) =>
      httpClient.patch(
        "/auth/account/profile",
        { displayName: vars.displayName },
        { requiresAuth: true },
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["auth", "me"] }),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (vars: ChangePasswordVars) =>
      httpClient.patch(
        "/auth/account/password",
        { currentPassword: vars.currentPassword, newPassword: vars.newPassword },
        { requiresAuth: true },
      ),
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: async () => {
      const { csrfToken } = await httpClient.get("/auth/csrf", { schema: CsrfSchema });
      await httpClient.delete("/auth/account", {
        requiresAuth: true,
        headers: { "X-Csrf-Token": csrfToken },
      });
      await authSDK.signOut();
    },
  });
}
