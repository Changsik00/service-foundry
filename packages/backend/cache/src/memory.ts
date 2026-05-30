import type { Cache } from "./port.js";

interface Entry {
  value: unknown;
  expiresAt: number | null;
}

/** in-memory 캐시 — Map + TTL 만료. 테스트/단일 인스턴스용. */
export function createMemoryCache(): Cache {
  const store = new Map<string, Entry>();

  const expiry = (ttlSeconds?: number): number | null =>
    ttlSeconds && ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null;

  const read = <T>(key: string): T | null => {
    const entry = store.get(key);
    if (!entry) return null;
    if (entry.expiresAt !== null && Date.now() >= entry.expiresAt) {
      store.delete(key);
      return null;
    }
    return entry.value as T;
  };

  return {
    get<T>(key: string): Promise<T | null> {
      return Promise.resolve(read<T>(key));
    },
    set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
      store.set(key, { value, expiresAt: expiry(ttlSeconds) });
      return Promise.resolve();
    },
    async getOrSet<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
      const hit = read<T>(key);
      if (hit !== null) return hit;
      const value = await loader();
      store.set(key, { value, expiresAt: expiry(ttlSeconds) });
      return value;
    },
    del(key: string): Promise<void> {
      store.delete(key);
      return Promise.resolve();
    },
  };
}
