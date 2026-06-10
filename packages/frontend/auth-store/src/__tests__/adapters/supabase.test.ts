import { describe, expect, it, vi } from "vitest";
import { connectSupabaseAuth } from "../../adapters/supabase.js";
import { createAuthStore } from "../../store.js";

type AuthChangeEvent = "SIGNED_IN" | "SIGNED_OUT" | "TOKEN_REFRESHED";
type Session = { access_token: string; user: { id: string; email?: string } };

function makeSupabaseClient(opts?: { initialSession?: Session | null }) {
  let listener: ((event: AuthChangeEvent, session: Session | null) => void) | undefined;
  const subscription = { unsubscribe: vi.fn() };

  return {
    auth: {
      onAuthStateChange: vi.fn((cb: typeof listener) => {
        listener = cb;
        if (opts?.initialSession !== undefined) {
          setTimeout(() => listener?.("SIGNED_IN", opts.initialSession ?? null), 0);
        }
        return { data: { subscription } };
      }),
      _trigger: (event: AuthChangeEvent, session: Session | null) => listener?.(event, session),
      _subscription: subscription,
    },
  };
}

describe("connectSupabaseAuth", () => {
  it("session 있을 때 → authenticated + access_token 설정", async () => {
    const client = makeSupabaseClient();
    const store = createAuthStore();
    connectSupabaseAuth(store, client as never);

    await client.auth._trigger("SIGNED_IN", {
      access_token: "supabase_token",
      user: { id: "u1", email: "a@b.com" },
    });

    expect(store.getState().status).toBe("authenticated");
    expect(store.getState().token).toBe("supabase_token");
  });

  it("session null → unauthenticated", async () => {
    const client = makeSupabaseClient();
    const store = createAuthStore();
    connectSupabaseAuth(store, client as never);
    await client.auth._trigger("SIGNED_OUT", null);
    expect(store.getState().status).toBe("unauthenticated");
    expect(store.getState().token).toBeNull();
  });

  it("unsubscribe 반환 — 호출 시 subscription 해제", () => {
    const client = makeSupabaseClient();
    const store = createAuthStore();
    const { unsubscribe } = connectSupabaseAuth(store, client as never);
    unsubscribe();
    expect(client.auth._subscription.unsubscribe).toHaveBeenCalledTimes(1);
  });
});
