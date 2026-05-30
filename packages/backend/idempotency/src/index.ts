import type { Cache } from "@repo/backend-cache";

/**
 * @repo/backend-idempotency — 멱등 실행 헬퍼 (core).
 * key 별 첫 실행 결과를 Cache 에 저장하고 재요청 시 재생(핸들러 미실행).
 */

// TDD 스텁 — 구현은 Green 단계.
export async function withIdempotency<T>(
  _cache: Cache,
  _key: string,
  _ttlSeconds: number,
  _fn: () => Promise<T>,
): Promise<T> {
  throw new Error("not implemented");
}
