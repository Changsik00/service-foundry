import type { Cache } from "@repo/backend-cache";

/**
 * @repo/backend-idempotency — 멱등 실행 헬퍼 (core).
 *
 * Idempotency-Key 별 첫 실행 결과를 Cache(@repo/backend-cache)에 저장하고,
 * 재요청 시 핸들러를 다시 실행하지 않고 저장값을 재생한다.
 * fn 예외 시 저장하지 않으므로 실패는 재시도 가능. 저장소는 Cache 포트(redis/in-memory).
 */
export async function withIdempotency<T>(
  cache: Cache,
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>,
): Promise<T> {
  const cached = await cache.get<T>(key);
  if (cached !== null) return cached;
  const result = await fn(); // 예외 시 전파 — 아래 set 미도달 → 미저장
  await cache.set(key, result, ttlSeconds);
  return result;
}
