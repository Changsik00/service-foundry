import { AppError } from "@repo/errors";
import argon2 from "argon2";

import { type HashOptions, resolveOptions } from "./options.js";

/**
 * `hashPassword(plain, opts?)` — argon2id PHC string 발급.
 *
 * - argon2 알고리즘 *id variant* 강제 (`argon2id`).
 * - cost parameter 는 `opts` 누락 시 `DEFAULT_OPTIONS` (OWASP 2023).
 * - 빈 input 거부 — `AppError({code:"PASSWORD_EMPTY", statusCode:400})`.
 *
 * 반환: `$argon2id$v=19$m=...$t=...$p=...$<salt>$<hash>` 형식 string.
 */
export const hashPassword = async (plain: string, opts?: HashOptions): Promise<string> => {
  if (typeof plain !== "string" || plain.length === 0) {
    throw new AppError({
      code: "PASSWORD_EMPTY",
      message: "hashPassword: plain must be a non-empty string",
      statusCode: 400,
    });
  }
  const resolved = resolveOptions(opts);
  return await argon2.hash(plain, {
    type: argon2.argon2id,
    memoryCost: resolved.memoryCost,
    timeCost: resolved.timeCost,
    parallelism: resolved.parallelism,
    hashLength: resolved.hashLength,
  });
};
