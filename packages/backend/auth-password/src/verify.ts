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
export const verifyPassword = async (_plain: string, _hash: string): Promise<boolean> => {
  // Red 단계 stub — Green commit 에서 argon2.verify 박음.
  throw new Error("not implemented");
};
