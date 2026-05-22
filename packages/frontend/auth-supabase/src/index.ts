import type { AuthResult, CoreAuthSDK, Session, User } from "@repo/auth-contracts";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { normalizeSupabaseAuthError } from "./normalize";

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export interface SupabaseExtensions {
  rls: SupabaseClient;
}

function toUser(u: { id: string; email?: string | null; created_at: string }): User {
  return {
    id: u.id,
    email: u.email ?? "",
    role: "user",
    createdAt: u.created_at,
  };
}

function toSession(userId: string, expiresAt: number | undefined): Session {
  const expiresAtIso = expiresAt
    ? new Date(expiresAt * 1000).toISOString()
    : new Date(Date.now() + 3600 * 1000).toISOString();
  return { userId, expiresAt: expiresAtIso };
}

export function createSupabaseAuthSDK(
  config: SupabaseConfig,
): CoreAuthSDK & { supabase: SupabaseExtensions } {
  const client = createClient(config.url, config.anonKey);

  return {
    async signIn(input): Promise<AuthResult> {
      const { data, error } = await client.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });
      if (error) return normalizeSupabaseAuthError(error);
      return {
        success: true,
        user: toUser(data.user),
        session: toSession(data.user.id, data.session.expires_at),
      };
    },

    async signUp(input): Promise<AuthResult> {
      const { data, error } = await client.auth.signUp({
        email: input.email,
        password: input.password,
      });
      if (error) return normalizeSupabaseAuthError(error);
      return {
        success: true,
        user: toUser(data.user!),
        session: toSession(data.user!.id, data.session!.expires_at),
      };
    },

    async signOut(): Promise<void> {
      await client.auth.signOut();
    },

    async getCurrentUser(): Promise<User | null> {
      const { data } = await client.auth.getUser();
      return data.user ? toUser(data.user) : null;
    },

    async refresh(): Promise<Session | null> {
      const { data } = await client.auth.refreshSession();
      if (!data.session || !data.user) return null;
      return toSession(data.user.id, data.session.expires_at);
    },

    supabase: {
      rls: client,
    },
  };
}
