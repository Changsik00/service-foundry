import type { AuthenticatorTransportFuture } from "@simplewebauthn/server";

export interface PasskeyConfig {
  rpID: string;
  rpName: string;
  origin: string;
}

export interface StoredCredential {
  credentialId: string;
  publicKey: string;
  counter: number;
  transports?: AuthenticatorTransportFuture[];
}
