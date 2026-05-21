import type { HashOptions } from "./options.js";

/**
 * `needsRehash(hash, opts?)` — 저장된 hash 의 cost 가 현 정책보다 약하면 `true`.
 *
 * 호출자 패턴 (signin flow):
 * ```
 * if (await verifyPassword(plain, stored)) {
 *   if (needsRehash(stored)) {
 *     const newHash = await hashPassword(plain);
 *     await userRepo.updatePasswordHash(userId, newHash);  // 백그라운드 rehash
 *   }
 *   // proceed with login
 * }
 * ```
 *
 * 현 정책 = `opts` (생략 시 `DEFAULT_OPTIONS`).
 */
export const needsRehash = (_hash: string, _opts?: HashOptions): boolean => {
  // Red 단계 stub — Green commit 에서 argon2.needsRehash 박음.
  throw new Error("not implemented");
};
