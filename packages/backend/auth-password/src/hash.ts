import type { HashOptions } from "./options.js";

/**
 * `hashPassword(plain, opts?)` — argon2id PHC string 발급.
 *
 * - argon2 알고리즘 *id variant* 강제 (`argon2id`).
 * - cost parameter 는 `opts` 누락 시 `DEFAULT_OPTIONS` (OWASP 2023).
 * - 빈 input 거부 — `AppError({code:"PASSWORD_EMPTY", statusCode:400})`.
 *
 * 반환: `$argon2id$v=19$m=...$t=...$p=...$<salt>$<hash>` 형식 string.
 */
export const hashPassword = async (_plain: string, _opts?: HashOptions): Promise<string> => {
  // Red 단계 stub — Green commit 에서 argon2.hash 박음.
  throw new Error("not implemented");
};
