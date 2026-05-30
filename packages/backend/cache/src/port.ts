/** 캐시 포트 (framework-agnostic). cache-aside(getOrSet) + TTL. */
export interface Cache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  /** 미스 시 loader 1회 호출 후 캐시, 히트 시 loader 미호출. */
  getOrSet<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T>;
  del(key: string): Promise<void>;
}
