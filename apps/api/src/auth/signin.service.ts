import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { signAccessToken } from "@repo/backend-auth-jwt";
import { verifyPassword } from "@repo/backend-auth-password";
import { createSession } from "@repo/backend-auth-session";
import { NESTJS_AUTH_OPTIONS, type NestjsAuthOptions } from "@repo/nestjs-auth";

import type { UserRow } from "../infra/schema/index.js";
import { InjectUserStore, type UserStore } from "./password-reset.stores.js";
import { InjectSessionStore, type SessionStore } from "./session.stores.js";

@Injectable()
export class SigninService {
  constructor(
    @InjectUserStore() private readonly userStore: UserStore,
    @InjectSessionStore() private readonly sessionStore: SessionStore,
    @Inject(NESTJS_AUTH_OPTIONS) private readonly authOpts: NestjsAuthOptions,
  ) {}

  async signIn(
    email: string,
    password: string,
  ): Promise<{ accessToken: string; user: UserRow; refreshToken: string }> {
    const user = await this.userStore.findByEmail(email);
    if (!user) throw new UnauthorizedException("invalid credentials");

    const valid = await verifyPassword(user.passwordHash, password);
    if (!valid) throw new UnauthorizedException("invalid credentials");

    const { refreshToken } = await createSession(this.sessionStore, { userId: user.id });
    const keyStore =
      typeof this.authOpts.keyStore === "function"
        ? this.authOpts.keyStore()
        : this.authOpts.keyStore;
    const accessToken = await signAccessToken({ sub: user.id, role: user.role }, keyStore, {
      issuer: this.authOpts.issuer,
      audience: this.authOpts.audience,
    });

    return { accessToken, user, refreshToken };
  }
}
