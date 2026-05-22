import { createHash, randomBytes } from "node:crypto";

/**
 * `generateRefreshToken` — URL-safe random token (256-bit entropy).
 *
 * Node 표준 `crypto.randomBytes(32)` → `base64url` encode. `Token` schema (min 20) 충족 (실 길이 ~43자).
 */
export function generateRefreshToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * `hashToken` — SHA-256 hex digest.
 *
 * ADR-0014: refresh token 은 *hash 저장* — DB 유출 시 plaintext 미노출.
 * 같은 token → 항상 같은 hash. 검증 시 hash 비교.
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
