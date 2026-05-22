export type {
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/server";
export { generateAuthenticationOpts, verifyAuthentication } from "./authentication.js";
export { generateRegistrationOpts, verifyRegistration } from "./registration.js";
export type { PasskeyConfig, StoredCredential } from "./types.js";
