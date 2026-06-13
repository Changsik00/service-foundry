import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { authSDK } from "@/lib/auth";
import { httpClient } from "@/lib/http-client";
import { source } from "@/lib/supabase-auth";

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

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const token = await source.getToken();
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
      const form = new FormData();
      form.append("avatar", file);
      const res = await fetch(`${baseUrl}/auth/account/avatar`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message ?? `Upload failed: ${res.status}`);
      }
      return (res.json() as Promise<{ avatarUrl: string }>).then((d) => d.avatarUrl);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["auth", "me"] }),
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
