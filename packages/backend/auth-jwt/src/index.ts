/**
 * @repo/backend-auth-jwt — Framework-agnostic JWT (EdDSA Ed25519) + JWKS.
 *
 * Implements ADR-0013 Decision 1/2/3/7. NestJS adapter → phase-06.
 */

export { createFakeKeyStore, type FakeKeyStore, type FakeKeyStoreInit } from "./fake-store.js";
export type { Alg, JwtClaims, KeyMaterial, KeyStore, PublicKeyMaterial } from "./keystore.js";
