import { AppError } from "@repo/errors";
import argon2 from "argon2";

const PHC_PREFIX = "$argon2";

/**
 * `verifyPassword(plain, hash)` — argon2id verify, timing-safe.
 *
 * - wrong password → `false` (예상 사용자 흐름)
 * - 빈 plain → `false` (hash 가 빈 string 에 매칭되지 않으므로)
 * - malformed hash (PHC string 깨짐) → throw (`AppError({code:"PASSWORD_HASH_MALFORMED", statusCode:500}`)
 *
 * jwt verify 와 다른 정책 (Result 아닌 boolean) — wrong password 는 boolean false 가 자연,
 * malformed hash 는 *프로그래밍/저장 오류* 라 throw 분리.
 */
export const verifyPassword = async (plain: string, hash: string): Promise<boolean> => {
  if (typeof hash !== "string" || !hash.startsWith(PHC_PREFIX)) {
    throw new AppError({
      code: "PASSWORD_HASH_MALFORMED",
      message: "verifyPassword: hash is not a valid argon2 PHC string",
      statusCode: 500,
    });
  }
  try {
    return await argon2.verify(hash, plain);
  } catch (e) {
    // argon2 가 *parse error* 류를 throw 하는 경우 — 동일 매핑.
    throw new AppError({
      code: "PASSWORD_HASH_MALFORMED",
      message: "verifyPassword: argon2 rejected the stored hash",
      statusCode: 500,
      cause: e,
    });
  }
};
