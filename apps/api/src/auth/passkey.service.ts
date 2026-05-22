import { randomUUID } from "node:crypto";
import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { signAccessToken } from "@repo/backend-auth-jwt";
import {
  type AuthenticationResponseJSON,
  generateAuthenticationOpts,
  generateRegistrationOpts,
  type PasskeyConfig,
  type RegistrationResponseJSON,
  verifyAuthentication,
  verifyRegistration,
} from "@repo/backend-auth-passkey";
import { createSession } from "@repo/backend-auth-session";

import { JwtService } from "../jwt/jwt.service.js";
import { JWT_SIGN_OPTIONS, type JwtSignOptions } from "./jwt-sign.options.js";
import { InjectPasskeyStore, type PasskeyStore } from "./passkey.stores.js";
import { InjectUserStore, type UserStore } from "./password-reset.stores.js";
import { InjectSessionStore, type SessionStore } from "./session.stores.js";

const CHALLENGE_TTL_MS = 5 * 60 * 1000;

@Injectable()
export class PasskeyService {
  private get passkeyConfig(): PasskeyConfig {
    return {
      rpID: this.jwtOpts.issuer.replace(/^https?:\/\//, "").split(":")[0] ?? "localhost",
      rpName: "service-foundry",
      origin: this.jwtOpts.issuer,
    };
  }

  constructor(
    @InjectPasskeyStore() private readonly passkeyStore: PasskeyStore,
    @InjectSessionStore() private readonly sessionStore: SessionStore,
    @InjectUserStore() private readonly userStore: UserStore,
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(JWT_SIGN_OPTIONS) private readonly jwtOpts: JwtSignOptions,
  ) {}

  async generateRegisterOptions(
    userId: string,
    userEmail: string,
  ): Promise<{ challengeToken: string; options: object }> {
    const existingCreds = await this.passkeyStore.findCredentialsByUserId(userId);
    const mapped = existingCreds.map((c) => ({ id: c.credentialId }));
    const options = await generateRegistrationOpts(
      this.passkeyConfig,
      { id: userId, email: userEmail },
      mapped,
    );
    const challengeToken = randomUUID();
    const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS);
    await this.passkeyStore.insertChallenge(challengeToken, options.challenge, userId, expiresAt);
    return { challengeToken, options };
  }

  async verifyRegister(
    userId: string,
    challengeToken: string,
    credential: RegistrationResponseJSON,
  ): Promise<void> {
    const challengeRow = await this.passkeyStore.findChallenge(challengeToken);
    if (!challengeRow) throw new UnauthorizedException("invalid or expired challenge");

    const verification = await verifyRegistration(
      this.passkeyConfig,
      credential,
      challengeRow.challenge,
    );
    if (!verification.verified || !verification.registrationInfo) {
      throw new UnauthorizedException("passkey registration verification failed");
    }

    const {
      credential: cred,
      credentialDeviceType,
      credentialBackedUp,
    } = verification.registrationInfo;
    await this.passkeyStore.insertCredential({
      userId,
      credentialId: cred.id,
      publicKey: Buffer.from(cred.publicKey).toString("base64url"),
      counter: cred.counter,
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
      transports: cred.transports ?? [],
    });
    await this.passkeyStore.deleteChallenge(challengeToken);
  }

  async generateAuthOptions(): Promise<{ challengeToken: string; options: object }> {
    const options = await generateAuthenticationOpts(this.passkeyConfig);
    const challengeToken = randomUUID();
    const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS);
    await this.passkeyStore.insertChallenge(challengeToken, options.challenge, null, expiresAt);
    return { challengeToken, options };
  }

  async verifyAuth(
    challengeToken: string,
    credentialId: string,
    response: AuthenticationResponseJSON,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const challengeRow = await this.passkeyStore.findChallenge(challengeToken);
    if (!challengeRow) throw new UnauthorizedException("invalid or expired challenge");

    const storedCred = await this.passkeyStore.findCredentialById(credentialId);
    if (!storedCred) throw new UnauthorizedException("credential not found");

    const verification = await verifyAuthentication(
      this.passkeyConfig,
      response,
      challengeRow.challenge,
      {
        credentialId: storedCred.credentialId,
        publicKey: storedCred.publicKey,
        counter: storedCred.counter,
      },
    );
    if (!verification.verified) throw new UnauthorizedException("passkey authentication failed");

    await this.passkeyStore.updateCounter(credentialId, verification.authenticationInfo.newCounter);
    await this.passkeyStore.deleteChallenge(challengeToken);

    const user = await this.userStore.findById(storedCred.userId);
    if (!user) throw new UnauthorizedException("user not found");

    const { refreshToken } = await createSession(this.sessionStore, { userId: storedCred.userId });
    const accessToken = await signAccessToken(
      { sub: storedCred.userId, role: user.role },
      this.jwtService.getKeyStore(),
      { issuer: this.jwtOpts.issuer, audience: this.jwtOpts.audience },
    );
    return { accessToken, refreshToken };
  }
}
