import { Redis } from "ioredis";

import type { Cache } from "./port.js";

export interface RedisCacheConnection {
  host: string;
  port: number;
}

export interface RedisCache extends Cache {
  close(): Promise<void>;
}

/** redis 캐시 어댑터 (ioredis). 값은 JSON 직렬화, TTL 은 EX(초). */
export function createRedisCache(connection: RedisCacheConnection): RedisCache {
  const client = new Redis({ host: connection.host, port: connection.port });

  const write = async (key: string, value: unknown, ttlSeconds?: number): Promise<void> => {
    const serialized = JSON.stringify(value);
    if (ttlSeconds && ttlSeconds > 0) {
      await client.set(key, serialized, "EX", ttlSeconds);
    } else {
      await client.set(key, serialized);
    }
  };

  return {
    async get<T>(key: string): Promise<T | null> {
      const raw = await client.get(key);
      return raw === null ? null : (JSON.parse(raw) as T);
    },
    async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
      await write(key, value, ttlSeconds);
    },
    async getOrSet<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
      const raw = await client.get(key);
      if (raw !== null) return JSON.parse(raw) as T;
      const value = await loader();
      await write(key, value, ttlSeconds);
      return value;
    },
    async del(key: string): Promise<void> {
      await client.del(key);
    },
    async close(): Promise<void> {
      await client.quit();
    },
  };
}
