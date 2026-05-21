/**
 * @repo/backend-auth-jwt — Framework-agnostic JWT (EdDSA Ed25519) + JWKS.
 *
 * Implements ADR-0013 Decision 1/2/3/7. NestJS adapter → phase-06.
 */

export { createFakeKeyStore, type FakeKeyStore, type FakeKeyStoreInit } from "./fake-store.js";
export { type Jwks, toJwks } from "./jwks.js";
export type { Alg, JwtClaims, KeyMaterial, KeyStore, PublicKeyMaterial } from "./keystore.js";
export {
  type CreateInMemoryKeyStoreOptions,
  createInMemoryKeyStore,
  type InMemoryKeyStore,
} from "./memory-store.js";
export {
  type SignAccessTokenOptions,
  type SignAccessTokenPayload,
  type SignedClaims,
  signAccessToken,
} from "./sign.js";
export {
  JwtErrorCode,
  type VerifyAccessTokenOptions,
  verifyAccessToken,
} from "./verify.js";
