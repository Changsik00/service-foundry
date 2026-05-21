import { generateKeyPair } from "jose";
import { describe, expect, it } from "vitest";

import type { PublicKeyMaterial } from "./keystore.js";
import { createInMemoryKeyStore } from "./memory-store.js";

const makeVerifyOnly = async (kid: string): Promise<PublicKeyMaterial> => {
  const { publicKey } = await generateKeyPair("EdDSA", {
    crv: "Ed25519",
    extractable: true,
  });
  return { kid, alg: "EdDSA", publicKey };
};

describe("createInMemoryKeyStore", () => {
  it("auto-generates a UUID kid when none provided", async () => {
    const store = await createInMemoryKeyStore();
    const active = await store.getActiveSigningKey();
    expect(active.kid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(active.alg).toBe("EdDSA");
    // CryptoKey 는 generateKey 결과의 *type* 속성을 보존.
    expect(active.privateKey.type).toBe("private");
    expect(active.publicKey.type).toBe("public");
  });

  it("respects explicit kid", async () => {
    const store = await createInMemoryKeyStore({ kid: "explicit-kid-1" });
    const active = await store.getActiveSigningKey();
    expect(active.kid).toBe("explicit-kid-1");
  });

  it("resolves active kid via getVerificationKey", async () => {
    const store = await createInMemoryKeyStore({ kid: "k-active" });
    const found = await store.getVerificationKey("k-active");
    expect(found?.kid).toBe("k-active");
    // private key 가 verification 결과에 *섞이지* 않아야 함.
    expect("privateKey" in (found ?? {})).toBe(false);
  });

  it("returns null for unknown kid", async () => {
    const store = await createInMemoryKeyStore();
    expect(await store.getVerificationKey("unknown")).toBeNull();
  });

  it("addVerificationOnlyKey is reflected in listActivePublicKeys + getVerificationKey", async () => {
    const store = await createInMemoryKeyStore({ kid: "k-new" });
    const old = await makeVerifyOnly("k-old");
    store.addVerificationOnlyKey(old);

    const list = await store.listActivePublicKeys();
    expect(list.map((k) => k.kid).sort()).toEqual(["k-new", "k-old"]);

    const oldFound = await store.getVerificationKey("k-old");
    expect(oldFound?.kid).toBe("k-old");
    expect(oldFound?.publicKey).toBe(old.publicKey);
  });
});
