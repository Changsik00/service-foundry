import { useContext } from "react";

import type { AuthContextValue } from "./context.js";
import { AuthContext } from "./context.js";

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

export function useSession(): Pick<AuthContextValue, "user" | "isLoading"> {
  const { user, isLoading } = useAuth();
  return { user, isLoading };
}
