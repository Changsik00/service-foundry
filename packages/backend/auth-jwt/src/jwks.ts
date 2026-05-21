import type { JWK } from "jose";

import type { KeyStore } from "./keystore.js";

/**
 * RFC 7517 JWKS — `/.well-known/jwks.json` endpoint payload.
 *
 * 활성 키 + verify-only 키들의 *public* JWK 목록. private key 노출 금지.
 * use="sig" + alg="EdDSA" + kid 부여 — 외부 검증자 (다른 마이크로서비스) 가
 * `jose.createRemoteJWKSet` 등으로 검증 가능.
 */
export interface Jwks {
  readonly keys: JWK[];
}

/**
 * `toJwks(store)` — KeyStore 의 `listActivePublicKeys` 를 RFC 7517 JWKS 로 변환.
 *
 * Endpoint mount (apps/api `/.well-known/jwks.json` 라우트) 는 별 spec — 본 함수는 helper.
 */
export const toJwks = async (_store: KeyStore): Promise<Jwks> => {
  // Red 단계 stub — Green commit 에서 jose.exportJWK 박음.
  throw new Error("not implemented");
};
