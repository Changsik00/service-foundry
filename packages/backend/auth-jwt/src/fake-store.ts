import type { KeyMaterial, KeyStore, PublicKeyMaterial } from "./keystore.js";

/**
 * Map 기반 fake `KeyStore` — *test 친화*, crypto 생성 비용 0.
 *
 * jose key 들은 test setup 에서 `generateKeyPair("EdDSA", ...)` 박은 후 본 fake 에 등록.
 * 본 spec 의 *프로덕션* 구현은 `createInMemoryKeyStore` (Task 3) — 본 fake 는 단순 contract 검증용.
 */
export interface FakeKeyStore extends KeyStore {
  setActive(key: KeyMaterial): void;
  addVerifyOnly(key: PublicKeyMaterial): void;
}

export interface FakeKeyStoreInit {
  active?: KeyMaterial;
  verifyOnly?: PublicKeyMaterial[];
}

const toPublic = (m: KeyMaterial): PublicKeyMaterial => ({
  kid: m.kid,
  alg: m.alg,
  publicKey: m.publicKey,
});

export const createFakeKeyStore = (init?: FakeKeyStoreInit): FakeKeyStore => {
  let active: KeyMaterial | null = init?.active ?? null;
  const verifyOnly = new Map<string, PublicKeyMaterial>();
  for (const v of init?.verifyOnly ?? []) verifyOnly.set(v.kid, v);

  return {
    setActive(key: KeyMaterial): void {
      active = key;
    },
    addVerifyOnly(key: PublicKeyMaterial): void {
      verifyOnly.set(key.kid, key);
    },
    async getActiveSigningKey(): Promise<KeyMaterial> {
      if (!active) {
        throw new Error("FakeKeyStore: no active signing key configured");
      }
      return active;
    },
    async getVerificationKey(kid: string): Promise<PublicKeyMaterial | null> {
      if (active && active.kid === kid) return toPublic(active);
      return verifyOnly.get(kid) ?? null;
    },
    async listActivePublicKeys(): Promise<PublicKeyMaterial[]> {
      const result: PublicKeyMaterial[] = [];
      if (active) result.push(toPublic(active));
      for (const v of verifyOnly.values()) result.push(v);
      return result;
    },
  };
};
