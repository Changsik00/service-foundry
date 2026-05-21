import type { RateLimitStore } from "./store.js";

/**
 * Rate-limit 정책 — IP / account 별 sliding window 한계.
 *
 * 기본값은 signin endpoint 기준. 다른 endpoint (password reset 등) 는 호출자가 override.
 */
export interface RateLimitOptions {
  /** IP 단위 window (ms). 기본 5분. */
  readonly ipWindowMs?: number;
  /** IP 단위 max attempts. 기본 30. */
  readonly ipMaxAttempts?: number;
  /** account 단위 window (ms). 기본 5분. */
  readonly accountWindowMs?: number;
  /** account 단위 max attempts. 기본 5. */
  readonly accountMaxAttempts?: number;
}

export const RATE_LIMIT_DEFAULTS: Required<RateLimitOptions> = {
  ipWindowMs: 5 * 60_000,
  ipMaxAttempts: 30,
  accountWindowMs: 5 * 60_000,
  accountMaxAttempts: 5,
};

const resolveOptions = (opts?: RateLimitOptions): Required<RateLimitOptions> => ({
  ipWindowMs: opts?.ipWindowMs ?? RATE_LIMIT_DEFAULTS.ipWindowMs,
  ipMaxAttempts: opts?.ipMaxAttempts ?? RATE_LIMIT_DEFAULTS.ipMaxAttempts,
  accountWindowMs: opts?.accountWindowMs ?? RATE_LIMIT_DEFAULTS.accountWindowMs,
  accountMaxAttempts: opts?.accountMaxAttempts ?? RATE_LIMIT_DEFAULTS.accountMaxAttempts,
});

export interface RateLimitContext {
  readonly ip: string;
  readonly accountKey: string;
  /** override 'now' for testing. */
  readonly at?: Date;
}

export type RateLimitDecision =
  | { readonly allowed: true }
  | {
      readonly allowed: false;
      readonly reason: "rate_limited";
      readonly retryAfterMs: number;
    };

/**
 * `checkRateLimit(store, ctx, opts?)` — IP / account 두 영역 *모두* 평가.
 *
 * 둘 중 *하나라도* limit 초과 → block. retryAfterMs 는 두 window 중 *더 긴* 값 (보수적).
 * lockout 상태는 별도 함수 (`isLocked`) — 호출자가 *둘 다* 호출 (lockout 우선).
 */
export const checkRateLimit = async (
  store: RateLimitStore,
  ctx: RateLimitContext,
  opts?: RateLimitOptions,
): Promise<RateLimitDecision> => {
  const o = resolveOptions(opts);
  const now = ctx.at ?? new Date();
  const ipSince = new Date(now.getTime() - o.ipWindowMs);
  const accountSince = new Date(now.getTime() - o.accountWindowMs);

  const [ipCount, accountCount] = await Promise.all([
    store.countRecentByIp(ctx.ip, ipSince),
    store.countRecentByAccount(ctx.accountKey, accountSince),
  ]);

  if (ipCount >= o.ipMaxAttempts || accountCount >= o.accountMaxAttempts) {
    const retryAfterMs = Math.max(
      ipCount >= o.ipMaxAttempts ? o.ipWindowMs : 0,
      accountCount >= o.accountMaxAttempts ? o.accountWindowMs : 0,
    );
    return { allowed: false, reason: "rate_limited", retryAfterMs };
  }
  return { allowed: true };
};

/**
 * `recordFailure(store, ctx)` — failed login insert.
 *
 * lockout 평가는 별 함수 (`evaluateLockout`, task 6) — 호출자가 `recordFailure` 후
 * `evaluateLockout` 박음 (책임 분리). 본 함수는 *insert 만*.
 */
export const recordFailure = async (
  store: RateLimitStore,
  ctx: RateLimitContext,
): Promise<void> => {
  await store.insertFailure({
    ip: ctx.ip,
    accountKey: ctx.accountKey,
    attemptedAt: ctx.at ?? new Date(),
  });
};

/**
 * `recordSuccess(store, accountKey)` — account 의 failed login 카운터 reset + lockout 해제.
 *
 * 성공 = 의심 해제. IP 카운터는 *보존* (한 IP 가 여러 account 시도 시 다른 account 영향 회피).
 */
export const recordSuccess = async (store: RateLimitStore, accountKey: string): Promise<void> => {
  await store.resetAccount(accountKey);
  await store.deleteLockout(accountKey);
};
