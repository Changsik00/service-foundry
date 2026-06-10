import type { AuthStatus, User } from "@repo/auth-contracts";
import { createStore } from "zustand/vanilla";

export interface AuthStoreState {
  status: AuthStatus;
  user: User | null;
  token: string | null;
  setAuthenticated(user: User, token: string): void;
  setUnauthenticated(): void;
  setToken(token: string): void;
}

export type AuthStore = ReturnType<typeof createAuthStore>;

export function createAuthStore() {
  return createStore<AuthStoreState>()((set) => ({
    status: "unknown",
    user: null,
    token: null,
    setAuthenticated: (user, token) => set({ status: "authenticated", user, token }),
    setUnauthenticated: () => set({ status: "unauthenticated", user: null, token: null }),
    setToken: (token) => set({ token }),
  }));
}
