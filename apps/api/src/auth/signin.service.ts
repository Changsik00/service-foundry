import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { signAccessToken } from "@repo/backend-auth-jwt";
import { verifyPassword } from "@repo/backend-auth-password";
import {
  createSession,
  hashToken,
  revokeSession as revokeSessionFn,
  rotateSession,
} from "@repo/backend-auth-session";

import type { UserRow } from "../infra/schema/index.js";
import { JwtService } from "../jwt/jwt.service.js";
import { JWT_SIGN_OPTIONS, type JwtSignOptions } from "./jwt-sign.options.js";
import { InjectUserStore, type UserStore } from "./password-reset.stores.js";
import { InjectSessionStore, type SessionStore } from "./session.stores.js";

@Injectable()
export class SigninService {
  constructor(
    @InjectUserStore() private readonly userStore: UserStore,
    @InjectSessionStore() private readonly sessionStore: SessionStore,
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(JWT_SIGN_OPTIONS) private readonly jwtOpts: JwtSignOptions,
  ) {}

  async signIn(
    email: string,
    password: string,
  ): Promise<{ accessToken: string; user: UserRow; refreshToken: string }> {
    const user = await this.userStore.findByEmail(email);
    if (!user || !user.passwordHash) throw new UnauthorizedException("invalid credentials");

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException("invalid credentials");

    const { refreshToken } = await createSession(this.sessionStore, { userId: user.id });
    const accessToken = await signAccessToken(
      { sub: user.id, role: user.role },
      this.jwtService.getKeyStore(),
      { issuer: this.jwtOpts.issuer, audience: this.jwtOpts.audience },
    );

    return { accessToken, user, refreshToken };
  }

  async refresh(
    presentedToken: string,
  ): Promise<{ accessToken: string; user: UserRow; refreshToken: string }> {
    const result = await rotateSession(this.sessionStore, presentedToken);
    if (result.type !== "rotated") {
      throw new UnauthorizedException("invalid or expired refresh token");
    }
    const user = await this.userStore.findById(result.session.userId);
    if (!user) throw new UnauthorizedException("user not found");

    const accessToken = await signAccessToken(
      { sub: user.id, role: user.role },
      this.jwtService.getKeyStore(),
      { issuer: this.jwtOpts.issuer, audience: this.jwtOpts.audience },
    );

    return { accessToken, user, refreshToken: result.refreshToken };
  }

  async revokeSession(presentedToken: string): Promise<void> {
    const session = await this.sessionStore.findByHash(hashToken(presentedToken));
    if (session?.revokedAt === null) {
      await revokeSessionFn(this.sessionStore, session.id);
    }
  }
}
