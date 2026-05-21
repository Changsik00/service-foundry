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

export const createInMemoryKeyStore = async (
  _opts?: CreateInMemoryKeyStoreOptions,
): Promise<InMemoryKeyStore> => {
  // Red 단계 stub — Green commit 에서 jose.generateKeyPair 박음.
  throw new Error("not implemented");
};
