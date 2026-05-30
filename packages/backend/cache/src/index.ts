/**
 * @repo/backend-cache — 캐시 포트 + in-memory/redis 어댑터 (core).
 */

export { createMemoryCache } from "./memory.js";
export type { Cache } from "./port.js";
export { createRedisCache, type RedisCache, type RedisCacheConnection } from "./redis.js";
