import type { RateLimitStore } from "./store.js";

/**
 * Lockout 정책 — N회 fail → locked → cooldown → 자동 unlock.
 *
 * progressive backoff — 반복 lockout 마다 cooldown ×2, 상한까지.
 */
export interface LockoutOptions {
  /** account 단위 fail 누적 threshold. 기본 5. */
  readonly threshold?: number;
  /** 평가 window (ms). threshold 카운트 기준 — 기본 5분 (rate-limit account window 일치). */
  readonly windowMs?: number;
  /** 첫 lockout cooldown (ms). 기본 15분. */
  readonly baseCooldownMs?: number;
  /** progressive backoff 상한 (ms). 기본 24h. */
  readonly maxCooldownMs?: number;
}

export const LOCKOUT_DEFAULTS: Required<LockoutOptions> = {
  threshold: 5,
  windowMs: 5 * 60_000,
  baseCooldownMs: 15 * 60_000,
  maxCooldownMs: 24 * 60 * 60_000,
};

const resolveLockoutOptions = (opts?: LockoutOptions): Required<LockoutOptions> => ({
  threshold: opts?.threshold ?? LOCKOUT_DEFAULTS.threshold,
  windowMs: opts?.windowMs ?? LOCKOUT_DEFAULTS.windowMs,
  baseCooldownMs: opts?.baseCooldownMs ?? LOCKOUT_DEFAULTS.baseCooldownMs,
  maxCooldownMs: opts?.maxCooldownMs ?? LOCKOUT_DEFAULTS.maxCooldownMs,
});

export type LockoutStatus =
  | { readonly locked: false }
  | { readonly locked: true; readonly until: Date; readonly streak: number };

/**
 * `isLocked(store, accountKey, at?)` — 현 시점의 lockout 상태 평가.
 *
 * `unlockAt > now` 면 locked. `< now` 면 자동 unlock (row 는 보존 — streak 유지).
 */
export const isLocked = async (
  store: RateLimitStore,
  accountKey: string,
  at?: Date,
): Promise<LockoutStatus> => {
  const row = await store.findLockout(accountKey);
  if (!row) return { locked: false };
  const now = at ?? new Date();
  if (row.unlockAt > now) {
    return { locked: true, until: row.unlockAt, streak: row.streak };
  }
  return { locked: false };
};

/**
 * `evaluateLockout(store, ctx, opts?)` — `recordFailure` 직후 호출.
 *
 * 최근 window 의 account fail 카운트가 threshold 이상이면 lockout 발급/갱신.
 * 기존 lockout 의 *streak* 보존 — 반복 lockout 시 cooldown ×2 (max 까지).
 *
 * 반환: lockout 발급되면 `{lockedUntil, streak}`, 아니면 null.
 */
export const evaluateLockout = async (
  store: RateLimitStore,
  ctx: { readonly accountKey: string; readonly at?: Date },
  opts?: LockoutOptions,
): Promise<{ lockedUntil: Date; streak: number } | null> => {
  const o = resolveLockoutOptions(opts);
  const now = ctx.at ?? new Date();
  const since = new Date(now.getTime() - o.windowMs);
  const count = await store.countRecentByAccount(ctx.accountKey, since);
  if (count < o.threshold) return null;

  const existing = await store.findLockout(ctx.accountKey);
  const nextStreak = (existing?.streak ?? 0) + 1;
  const cooldownMs = Math.min(o.baseCooldownMs * 2 ** (nextStreak - 1), o.maxCooldownMs);
  const lockedUntil = new Date(now.getTime() + cooldownMs);

  await store.upsertLockout({
    accountKey: ctx.accountKey,
    lockedAt: now,
    unlockAt: lockedUntil,
    streak: nextStreak,
  });
  return { lockedUntil, streak: nextStreak };
};
