import { generateKeyPair } from "jose";
import { describe, expect, it } from "vitest";

import { createFakeKeyStore } from "./fake-store.js";
import type { KeyMaterial, PublicKeyMaterial } from "./keystore.js";

const makeMaterial = async (kid: string): Promise<KeyMaterial> => {
  const { publicKey, privateKey } = await generateKeyPair("EdDSA", {
    crv: "Ed25519",
    extractable: true,
  });
  return { kid, alg: "EdDSA", privateKey, publicKey };
};

describe("KeyStore contract (via fake-store)", () => {
  it("returns active signing key", async () => {
    const material = await makeMaterial("k1");
    const store = createFakeKeyStore({ active: material });
    const active = await store.getActiveSigningKey();
    expect(active.kid).toBe("k1");
    expect(active.alg).toBe("EdDSA");
    expect(active.privateKey).toBe(material.privateKey);
  });

  it("throws when no active signing key configured", async () => {
    const store = createFakeKeyStore();
    await expect(store.getActiveSigningKey()).rejects.toThrow();
  });

  it("resolves active kid via getVerificationKey", async () => {
    const material = await makeMaterial("k1");
    const store = createFakeKeyStore({ active: material });
    const found = await store.getVerificationKey("k1");
    expect(found?.kid).toBe("k1");
    expect(found?.publicKey).toBe(material.publicKey);
  });

  it("returns null for unknown kid", async () => {
    const material = await makeMaterial("k1");
    const store = createFakeKeyStore({ active: material });
    expect(await store.getVerificationKey("unknown")).toBeNull();
  });

  it("lists active + verify-only public keys (kid set union)", async () => {
    const active = await makeMaterial("k1");
    const old = await makeMaterial("k0");
    const verifyOnly: PublicKeyMaterial = {
      kid: old.kid,
      alg: old.alg,
      publicKey: old.publicKey,
    };
    const store = createFakeKeyStore({ active, verifyOnly: [verifyOnly] });
    const list = await store.listActivePublicKeys();
    expect(list.map((k) => k.kid).sort()).toEqual(["k0", "k1"]);
    // private key 가 *공개 목록* 에 노출되어선 안 됨
    for (const entry of list) {
      expect("privateKey" in entry).toBe(false);
    }
  });
});
