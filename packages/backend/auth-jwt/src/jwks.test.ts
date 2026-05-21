import { generateKeyPair } from "jose";
import { describe, expect, it } from "vitest";

import { toJwks } from "./jwks.js";
import type { PublicKeyMaterial } from "./keystore.js";
import { createInMemoryKeyStore } from "./memory-store.js";

const makeVerifyOnly = async (kid: string): Promise<PublicKeyMaterial> => {
  const { publicKey } = await generateKeyPair("EdDSA", {
    crv: "Ed25519",
    extractable: true,
  });
  return { kid, alg: "EdDSA", publicKey };
};

describe("toJwks", () => {
  it("emits RFC 7517 JWKS shape for an Ed25519 active key", async () => {
    const store = await createInMemoryKeyStore({ kid: "k-active" });
    const jwks = await toJwks(store);
    expect(Array.isArray(jwks.keys)).toBe(true);
    expect(jwks.keys).toHaveLength(1);

    const [entry] = jwks.keys;
    expect(entry).toBeDefined();
    if (!entry) throw new Error("unreachable");
    expect(entry.kty).toBe("OKP");
    expect(entry.crv).toBe("Ed25519");
    expect(entry.alg).toBe("EdDSA");
    expect(entry.kid).toBe("k-active");
    expect(entry.use).toBe("sig");
    expect(typeof entry.x).toBe("string"); // base64url public key
  });

  it("does not expose private key components (no d field)", async () => {
    const store = await createInMemoryKeyStore({ kid: "k1" });
    const jwks = await toJwks(store);
    for (const entry of jwks.keys) {
      expect("d" in entry).toBe(false);
    }
  });

  it("includes verify-only keys alongside active key (multi-kid rotation grace)", async () => {
    const store = await createInMemoryKeyStore({ kid: "k-new" });
    const oldKey = await makeVerifyOnly("k-old");
    store.addVerificationOnlyKey(oldKey);

    const jwks = await toJwks(store);
    const kids = jwks.keys.map((k) => k.kid).sort();
    expect(kids).toEqual(["k-new", "k-old"]);
    for (const entry of jwks.keys) {
      expect(entry.alg).toBe("EdDSA");
      expect(entry.use).toBe("sig");
    }
  });
});
