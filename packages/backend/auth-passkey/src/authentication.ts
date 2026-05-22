import {
  type AuthenticationResponseJSON,
  type AuthenticatorTransportFuture,
  generateAuthenticationOptions,
  type VerifiedAuthenticationResponse,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";

import type { PasskeyConfig, StoredCredential } from "./types.js";

export async function generateAuthenticationOpts(
  config: PasskeyConfig,
  allowCredentials: { id: string; transports?: AuthenticatorTransportFuture[] }[] = [],
) {
  return generateAuthenticationOptions({
    rpID: config.rpID,
    allowCredentials,
    userVerification: "preferred",
  });
}

export async function verifyAuthentication(
  config: PasskeyConfig,
  response: AuthenticationResponseJSON,
  expectedChallenge: string,
  storedCredential: StoredCredential,
): Promise<VerifiedAuthenticationResponse> {
  return verifyAuthenticationResponse({
    response,
    expectedChallenge,
    expectedOrigin: config.origin,
    expectedRPID: config.rpID,
    credential: {
      id: storedCredential.credentialId,
      publicKey: Buffer.from(storedCredential.publicKey, "base64url"),
      counter: storedCredential.counter,
      ...(storedCredential.transports !== undefined && { transports: storedCredential.transports }),
    },
  });
}
