import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { signAccessToken, verifyAccessToken } from "@repo/backend-auth-jwt";
import {
  generateBackupCodes,
  generateSecret,
  generateTotpUri,
  hashBackupCodes,
  verifyBackupCode,
  verifyTotp,
} from "@repo/backend-auth-mfa";
import { createSession } from "@repo/backend-auth-session";

import { JwtService } from "../jwt/jwt.service.js";
import { JWT_SIGN_OPTIONS, type JwtSignOptions } from "./jwt-sign.options.js";
import { InjectMfaStore, type MfaStore } from "./mfa.stores.js";
import { InjectUserStore, type UserStore } from "./password-reset.stores.js";
import { InjectSessionStore, type SessionStore } from "./session.stores.js";

const MFA_CHALLENGE_AUDIENCE = "mfa_challenge";
const MFA_CHALLENGE_TTL = "5m";

@Injectable()
export class MfaService {
  constructor(
    @InjectMfaStore() private readonly mfaStore: MfaStore,
    @InjectSessionStore() private readonly sessionStore: SessionStore,
    @InjectUserStore() private readonly userStore: UserStore,
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(JWT_SIGN_OPTIONS) private readonly jwtOpts: JwtSignOptions,
  ) {}

  async enroll(userId: string): Promise<{ totpUri: string }> {
    const secret = generateSecret();
    await this.mfaStore.upsert(userId, secret);
    const totpUri = generateTotpUri(secret, userId, this.jwtOpts.issuer);
    return { totpUri };
  }

  async confirmEnroll(userId: string, code: string): Promise<{ backupCodes: string[] }> {
    const config = await this.mfaStore.findByUserId(userId);
    if (!config) throw new UnauthorizedException("MFA not enrolled");
    if (!verifyTotp(config.secret, code)) throw new UnauthorizedException("invalid TOTP code");
    const backupCodes = generateBackupCodes();
    const hashes = await hashBackupCodes(backupCodes);
    await this.mfaStore.updateEnabled(userId, true, hashes);
    return { backupCodes };
  }

  async signMfaChallengeToken(userId: string): Promise<string> {
    return signAccessToken({ sub: userId, type: "mfa_challenge" }, this.jwtService.getKeyStore(), {
      issuer: this.jwtOpts.issuer,
      audience: MFA_CHALLENGE_AUDIENCE,
      expiresIn: MFA_CHALLENGE_TTL,
    });
  }

  async verifyMfa(
    mfaChallengeToken: string,
    code: string,
  ): Promise<{ accessToken: string; refreshToken: string; userId: string }> {
    const result = await verifyAccessToken(mfaChallengeToken, this.jwtService.getKeyStore(), {
      issuer: this.jwtOpts.issuer,
      audience: MFA_CHALLENGE_AUDIENCE,
    });
    if (!result.ok) throw new UnauthorizedException("invalid mfa challenge token");

    const userId = result.value.sub;
    const config = await this.mfaStore.findByUserId(userId);
    if (!config?.enabled) throw new UnauthorizedException("MFA not enabled");

    const totpValid = verifyTotp(config.secret, code);
    if (!totpValid) {
      const backupIdx = await verifyBackupCode(code, config.backupCodeHashes);
      if (backupIdx === -1) throw new UnauthorizedException("invalid TOTP or backup code");
      const updatedHashes = config.backupCodeHashes.filter((_, i) => i !== backupIdx);
      await this.mfaStore.updateEnabled(userId, true, updatedHashes);
    }

    const user = await this.userStore.findById(userId);
    if (!user) throw new UnauthorizedException("user not found");

    const { refreshToken } = await createSession(this.sessionStore, { userId });
    const accessToken = await signAccessToken(
      { sub: userId, role: user.role },
      this.jwtService.getKeyStore(),
      { issuer: this.jwtOpts.issuer, audience: this.jwtOpts.audience },
    );
    return { accessToken, refreshToken, userId };
  }

  async disable(userId: string, code: string): Promise<void> {
    const config = await this.mfaStore.findByUserId(userId);
    if (!config?.enabled) throw new UnauthorizedException("MFA not enabled");
    if (!verifyTotp(config.secret, code)) throw new UnauthorizedException("invalid TOTP code");
    await this.mfaStore.deleteByUserId(userId);
  }

  async isMfaEnabled(userId: string): Promise<boolean> {
    const config = await this.mfaStore.findByUserId(userId);
    return config?.enabled === true;
  }
}
