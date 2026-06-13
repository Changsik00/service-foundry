import type { UseMutationResult } from "@tanstack/react-query";

export interface UpdateProfileVars {
  displayName: string;
}

export interface ChangePasswordVars {
  currentPassword: string;
  newPassword: string;
}

export function useUpdateProfile(): UseMutationResult<void, Error, UpdateProfileVars> {
  throw new Error("not implemented");
}

export function useChangePassword(): UseMutationResult<void, Error, ChangePasswordVars> {
  throw new Error("not implemented");
}

export function useDeleteAccount(): UseMutationResult<void, Error, void> {
  throw new Error("not implemented");
}
