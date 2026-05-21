import type { KeyMaterial, KeyStore, PublicKeyMaterial } from "./keystore.js";

/**
 * Map 기반 fake `KeyStore` — *test 친화*, crypto 의존성 0.
 *
 * jose key 들은 test setup 에서 `generateKeyPair("EdDSA", ...)` 박은 후 본 fake 에 등록.
 * 본 spec 의 *프로덕션* 구현은 `createInMemoryKeyStore` (Task 3) — fake 는 단순 contract 검증용.
 */
export interface FakeKeyStore extends KeyStore {
  setActive(key: KeyMaterial): void;
  addVerifyOnly(key: PublicKeyMaterial): void;
}

export interface FakeKeyStoreInit {
  active?: KeyMaterial;
  verifyOnly?: PublicKeyMaterial[];
}

export const createFakeKeyStore = (init?: FakeKeyStoreInit): FakeKeyStore => {
  // Red 단계 stub — Green commit 에서 실 동작 박음.
  throw new Error("not implemented");
};
