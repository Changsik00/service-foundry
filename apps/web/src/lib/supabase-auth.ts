import { createAuthStore } from "@repo/frontend-auth-store";
import { connectSupabaseAuth } from "@repo/frontend-auth-store/adapters/supabase";
import { createSupabaseAuthSDK } from "@repo/frontend-auth-supabase";

import { getPublicEnv } from "@/env";

const env = getPublicEnv();

export const sdk = createSupabaseAuthSDK({
  url: env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
});

const store = createAuthStore();

export const { source, unsubscribe } = connectSupabaseAuth(store, sdk.supabase.rls);
