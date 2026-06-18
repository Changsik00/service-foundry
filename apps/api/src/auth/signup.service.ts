import { ConflictException, Inject, Injectable } from "@nestjs/common";
import { ACTIVE_ORG_CLAIM, ORG_ROLE_CLAIM, signAccessToken } from "@repo/backend-auth-jwt";
import { hashPassword } from "@repo/backend-auth-password";
import { createSession } from "@repo/backend-auth-session";

import type { UserRow } from "../infra/schema/index.js";
import { JwtService } from "../jwt/jwt.service.js";
import { type IProvisionService, PROVISION_SERVICE } from "../provision/provision.service.js";
import { JWT_SIGN_OPTIONS, type JwtSignOptions } from "./jwt-sign.options.js";
import { InjectUserStore, type UserStore } from "./password-reset.stores.js";
import { InjectSessionStore, type SessionStore } from "./session.stores.js";

@Injectable()
export class SignupService {
  constructor(
    @InjectUserStore() private readonly userStore: UserStore,
    @InjectSessionStore() private readonly sessionStore: SessionStore,
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(JWT_SIGN_OPTIONS) private readonly jwtOpts: JwtSignOptions,
    @Inject(PROVISION_SERVICE) private readonly provisionService: IProvisionService,
  ) {}

  async signUp(
    email: string,
    password: string,
  ): Promise<{ accessToken: string; user: UserRow; refreshToken: string }> {
    const existing = await this.userStore.findByEmail(email);
    if (existing) throw new ConflictException("email already registered");

    const passwordHash = await hashPassword(password);
    const user = await this.userStore.insert({ email, passwordHash, role: "user" });

    const { refreshToken } = await createSession(this.sessionStore, { userId: user.id });
    const { orgId, orgRole } = await this.provisionService.provisionUser(user.id, email);
    const accessToken = await signAccessToken(
      { sub: user.id, role: user.role, [ACTIVE_ORG_CLAIM]: orgId, [ORG_ROLE_CLAIM]: orgRole },
      this.jwtService.getKeyStore(),
      { issuer: this.jwtOpts.issuer, audience: this.jwtOpts.audience },
    );

    return { accessToken, user, refreshToken };
  }
}
