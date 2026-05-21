/**
 * @repo/backend-auth-password — argon2id password hashing (ADR-0014).
 *
 * Framework-agnostic. NestJS adapter → phase-06.
 */
export { hashPassword } from "./hash.js";
export {
  DEFAULT_OPTIONS,
  type HashOptions,
  resolveOptions,
} from "./options.js";
export { verifyPassword } from "./verify.js";
