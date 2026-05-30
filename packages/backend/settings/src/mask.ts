/**
 * config/settings 객체의 시크릿 값을 마스킹한다 (startup-report 등 안전 출력용).
 *
 * 키 이름 기준으로 마스킹한다 — 값은 검사하지 않는다.
 * `@repo/backend-logger` 의 redact 컨벤션과 정합.
 */

export const MASK = "***REDACTED***";

/** 키에 이 부분문자열(소문자)이 포함되면 마스킹 */
export const DEFAULT_REDACT_SUBSTRINGS: readonly string[] = [
  "secret",
  "password",
  "passwd",
  "token",
  "credential",
  "authorization",
  "cookie",
  "private_key",
  "api_key",
  "apikey",
];

/** 정확히 일치하면 마스킹 (값에 자격증명이 포함되는 URL 등) */
export const DEFAULT_REDACT_KEYS: readonly string[] = ["database_url", "redis_url"];

export interface MaskOptions {
  redactSubstrings?: readonly string[];
  redactKeys?: readonly string[];
}

export function maskConfig<T extends Record<string, unknown>>(
  config: T,
  options: MaskOptions = {},
): Record<string, unknown> {
  const subs = (options.redactSubstrings ?? DEFAULT_REDACT_SUBSTRINGS).map((s) => s.toLowerCase());
  const keys = new Set((options.redactKeys ?? DEFAULT_REDACT_KEYS).map((k) => k.toLowerCase()));

  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(config)) {
    const lower = key.toLowerCase();
    const isSecret = keys.has(lower) || subs.some((s) => lower.includes(s));
    out[key] = isSecret ? MASK : value;
  }
  return out;
}
