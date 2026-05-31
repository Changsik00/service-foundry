/**
 * @repo/backend-rate-limit — 범용 rate limiter 포트 + in-memory 어댑터.
 *
 * 로그인 전용 `@repo/backend-auth-rate-limit`(IP+account sliding window + lockout)과 별개로,
 * 임의 키(웹훅/외부호출/워커 작업)에 대한 throttling 을 제공한다. framework-agnostic (ADR-0015).
 * redis 어댑터는 후속.
 */

export interface RateLimitResult {
  /** 이번 consume 이 허용됐는가 */
  allowed: boolean;
  /** 현재 윈도우에서 남은 허용량 */
  remaining: number;
  /** 차단 시 다음 시도까지 대기(ms). 허용 시 0 */
  retryAfterMs: number;
}

export interface RateLimiter {
  /** key 에 cost(기본 1)만큼 소비 시도 */
  consume(key: string, cost?: number): Promise<RateLimitResult>;
}

export interface MemoryRateLimiterOptions {
  /** 윈도우당 최대 허용량 */
  limit: number;
  /** 윈도우 길이(ms) */
  windowMs: number;
  /** 현재 시각(ms) 주입 — 테스트 결정성. 기본 Date.now */
  now?: () => number;
}

const STUB = "spec-14-05: createMemoryRateLimiter not implemented yet";

export function createMemoryRateLimiter(_opts: MemoryRateLimiterOptions): RateLimiter {
  throw new Error(STUB);
}
