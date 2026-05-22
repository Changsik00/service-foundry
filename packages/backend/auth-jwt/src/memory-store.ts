import { randomUUID } from "node:crypto";

import { generateKeyPair } from "jose";

import type { KeyMaterial, KeyStore, PublicKeyMaterial } from "./keystore.js";

/**
 * In-memory `KeyStore` — *프로덕션 가능* 구현 (단일 인스턴스 한정).
 *
 * Ed25519 keypair 1개를 process 메모리에 보관. 다중 인스턴스 / 배포에서는 *모두 같은 키* 가
 * 필요하므로 phase-10 의 file / KMS keystore 로 swap 필수.
 *
 * 회전 (rotation) 은 본 spec scope 밖 — 운영 시점에 신규 store 생성 후 swap, 기존은
 * `addVerificationOnlyKey` 로 verify-only grace period 운영.
 */
export interface InMemoryKeyStore extends KeyStore {
  addVerificationOnlyKey(key: PublicKeyMaterial): void;
}

export interface CreateInMemoryKeyStoreOptions {
  /** 명시적 kid (생략 시 `crypto.randomUUID()` 자동 발급). */
  kid?: string;
  /** 추가로 verify-only 로 등록할 키들 (이전 active 키 grace period 등). */
  verifyOnly?: PublicKeyMaterial[];
}

const toPublic = (m: KeyMaterial): PublicKeyMaterial => ({
  kid: m.kid,
  alg: m.alg,
  publicKey: m.publicKey,
});

export const createInMemoryKeyStore = async (
  opts?: CreateInMemoryKeyStoreOptions,
): Promise<InMemoryKeyStore> => {
  const { publicKey, privateKey } = await generateKeyPair("EdDSA", {
    crv: "Ed25519",
    extractable: true,
  });
  const active: KeyMaterial = {
    kid: opts?.kid ?? randomUUID(),
    alg: "EdDSA",
    privateKey,
    publicKey,
  };
  const verifyOnly = new Map<string, PublicKeyMaterial>();
  for (const v of opts?.verifyOnly ?? []) verifyOnly.set(v.kid, v);

  return {
    addVerificationOnlyKey(key: PublicKeyMaterial): void {
      verifyOnly.set(key.kid, key);
    },
    async getActiveSigningKey(): Promise<KeyMaterial> {
      return active;
    },
    async getVerificationKey(kid: string): Promise<PublicKeyMaterial | null> {
      if (kid === active.kid) return toPublic(active);
      return verifyOnly.get(kid) ?? null;
    },
    async listActivePublicKeys(): Promise<PublicKeyMaterial[]> {
      const result: PublicKeyMaterial[] = [toPublic(active)];
      for (const v of verifyOnly.values()) result.push(v);
      return result;
    },
  };
};
