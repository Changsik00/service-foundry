import type { AuthSource } from "@repo/auth-contracts";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAuthSource } from "../source.js";
import type { AuthStore } from "../store.js";

interface ConnectSupabaseResult {
  source: AuthSource;
  unsubscribe: () => void;
}

export function connectSupabaseAuth(
  store: AuthStore,
  client: SupabaseClient,
): ConnectSupabaseResult {
  const {
    data: { subscription },
  } = client.auth.onAuthStateChange(async (_event, session) => {
    if (!session) {
      store.getState().setUnauthenticated();
      return;
    }
    store.getState().setAuthenticated(
      {
        id: session.user.id,
        email: session.user.email ?? "",
        role: "user",
        createdAt: session.user.created_at ?? new Date().toISOString(),
      },
      session.access_token,
    );
  });

  const source = createAuthSource(store, {
    refresh: async () => {
      const { data, error } = await client.auth.refreshSession();
      if (error || !data.session) throw error ?? new Error("Supabase: refresh failed");
      store.getState().setToken(data.session.access_token);
    },
  });

  return { source, unsubscribe: () => subscription.unsubscribe() };
}
