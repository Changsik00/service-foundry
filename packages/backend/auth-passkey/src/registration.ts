import {
  type AuthenticatorTransportFuture,
  generateRegistrationOptions,
  type RegistrationResponseJSON,
  type VerifiedRegistrationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";

import type { PasskeyConfig } from "./types.js";

export async function generateRegistrationOpts(
  config: PasskeyConfig,
  user: { id: string; email: string },
  excludeCredentials: { id: string; transports?: AuthenticatorTransportFuture[] }[] = [],
) {
  return generateRegistrationOptions({
    rpName: config.rpName,
    rpID: config.rpID,
    userName: user.email,
    attestationType: "none",
    excludeCredentials,
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
  });
}

export async function verifyRegistration(
  config: PasskeyConfig,
  response: RegistrationResponseJSON,
  expectedChallenge: string,
): Promise<VerifiedRegistrationResponse> {
  return verifyRegistrationResponse({
    response,
    expectedChallenge,
    expectedOrigin: config.origin,
    expectedRPID: config.rpID,
  });
}
