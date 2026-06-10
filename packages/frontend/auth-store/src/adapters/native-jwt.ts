import type { AuthSource, User } from "@repo/auth-contracts";
import { createAuthSource } from "../source.js";
import type { AuthStore } from "../store.js";

export interface NativeJwtOptions {
  getStoredToken(): string | null;
  refresh(): Promise<{ token: string; user: User }>;
}

interface ConnectNativeJwtResult {
  source: AuthSource;
}

export async function connectNativeJwt(
  store: AuthStore,
  opts: NativeJwtOptions,
): Promise<ConnectNativeJwtResult> {
  const stored = opts.getStoredToken();
  if (!stored) {
    store.getState().setUnauthenticated();
    return { source: createAuthSource(store) };
  }

  try {
    const { token, user } = await opts.refresh();
    store.getState().setAuthenticated(user, token);
  } catch {
    store.getState().setUnauthenticated();
  }

  const source = createAuthSource(store, {
    refresh: async () => {
      const { token, user } = await opts.refresh();
      store.getState().setAuthenticated(user, token);
    },
  });

  return { source };
}
