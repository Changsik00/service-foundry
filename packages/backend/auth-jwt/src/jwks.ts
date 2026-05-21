import { exportJWK, type JWK } from "jose";

import type { KeyStore, PublicKeyMaterial } from "./keystore.js";

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

const toJwk = async (entry: PublicKeyMaterial): Promise<JWK> => {
  const jwk = await exportJWK(entry.publicKey);
  // `exportJWK` 가 일부 환경에서 *private* 필드 (`d`) 를 포함할 가능성을 차단 — 항상 제거.
  if ("d" in jwk) delete (jwk as { d?: unknown }).d;
  return {
    ...jwk,
    kid: entry.kid,
    alg: entry.alg,
    use: "sig",
  };
};

/**
 * `toJwks(store)` — KeyStore 의 `listActivePublicKeys` 를 RFC 7517 JWKS 로 변환.
 *
 * Endpoint mount (apps/api `/.well-known/jwks.json` 라우트) 는 별 spec — 본 함수는 helper.
 */
export const toJwks = async (store: KeyStore): Promise<Jwks> => {
  const entries = await store.listActivePublicKeys();
  const keys = await Promise.all(entries.map((e) => toJwk(e)));
  return { keys };
};
