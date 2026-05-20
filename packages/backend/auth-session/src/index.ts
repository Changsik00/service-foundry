/**
 * @repo/backend-auth-session — pure backend session management.
 *
 * - Drizzle Session schema (`./schema`)
 * - Token primitives — `crypto.randomBytes(32).toString("base64url")` + SHA-256 hash
 * - 3 함수: `createSession` / `rotateSession` / `revokeSession`
 * - Rotation chain (`refreshTokenFamily`) + reuse detection (ADR-0013)
 * - Refresh token *hash 저장* (ADR-0014)
 *
 * 본 패키지는 framework-agnostic — NestJS adapter 는 phase-06 (`@repo/nestjs-auth-session`).
 */

export { drizzleSessionStore } from "./drizzle-store.js";
export { type SessionInsert, type SessionRow, schema, sessions } from "./schema.js";
export {
  type CreateSessionInput,
  type CreateSessionResult,
  createSession,
  generateRefreshToken,
  hashToken,
  type RotateResult,
  revokeSession,
  rotateSession,
} from "./session.js";
export type { SessionStore } from "./store.js";
