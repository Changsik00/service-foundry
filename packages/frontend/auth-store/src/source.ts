import type { AuthSource } from "@repo/auth-contracts";
import type { AuthStore } from "./store";

interface AuthSourceOptions {
  refresh?: () => Promise<void>;
}

export function createAuthSource(store: AuthStore, opts?: AuthSourceOptions): AuthSource {
  return {
    get status() {
      return store.getState().status;
    },

    getToken: async () => store.getState().token,

    refresh: async () => {
      if (!opts?.refresh) throw new Error("refresh not configured — connect an adapter first");
      return opts.refresh();
    },

    waitUntilSettled: (timeoutMs = 5_000) => {
      if (store.getState().status !== "unknown") return Promise.resolve();
      return new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, timeoutMs);
        const unsub = store.subscribe((state) => {
          if (state.status !== "unknown") {
            clearTimeout(timer);
            unsub();
            resolve();
          }
        });
      });
    },
  };
}
