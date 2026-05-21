import type { Role } from "@repo/auth-contracts";
import type { ReactNode } from "react";

import { useAuth } from "./hooks.js";

interface RequireAuthProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function RequireAuth({ children, fallback = null }: RequireAuthProps) {
  const { user, isLoading } = useAuth();
  if (isLoading || !user) return <>{fallback}</>;
  return <>{children}</>;
}

interface RequireRoleProps {
  role: Role;
  children: ReactNode;
  fallback?: ReactNode;
}

export function RequireRole({ role, children, fallback = null }: RequireRoleProps) {
  const { user, isLoading } = useAuth();
  if (isLoading || !user || user.role !== role) return <>{fallback}</>;
  return <>{children}</>;
}
