import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { ACTIVE_ORG_CLAIM, ORG_ROLE_CLAIM, signAccessToken } from "@repo/backend-auth-jwt";
import { DATABASE, type Database } from "@repo/nestjs-database";
import { and, eq } from "drizzle-orm";

import { memberships } from "../infra/schema/memberships.js";
import { users } from "../infra/schema/users.js";
import { JwtService } from "../jwt/jwt.service.js";
import { JWT_SIGN_OPTIONS, type JwtSignOptions } from "./jwt-sign.options.js";

export interface IOrgSwitchService {
  switch(userId: string, newOrgId: string): Promise<{ accessToken: string }>;
}

@Injectable()
export class OrgSwitchService implements IOrgSwitchService {
  constructor(
    @Inject(DATABASE) private readonly database: Database<Record<string, unknown>>,
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(JWT_SIGN_OPTIONS) private readonly jwtOpts: JwtSignOptions,
  ) {}

  async switch(userId: string, newOrgId: string): Promise<{ accessToken: string }> {
    const [membership] = await this.database.db
      .select()
      .from(memberships)
      .where(and(eq(memberships.userId, userId), eq(memberships.orgId, newOrgId)));

    if (!membership) throw new ForbiddenException("membership not found");

    // 전역 role 클레임 필수(AuthGuard 가 요구) — 누락 시 발급 토큰이 다음 요청에서 401.
    const [user] = await this.database.db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId));
    if (!user) throw new ForbiddenException("user not found");

    const accessToken = await signAccessToken(
      {
        sub: userId,
        role: user.role,
        [ACTIVE_ORG_CLAIM]: newOrgId,
        [ORG_ROLE_CLAIM]: membership.role,
      },
      this.jwtService.getKeyStore(),
      { issuer: this.jwtOpts.issuer, audience: this.jwtOpts.audience },
    );
    return { accessToken };
  }
}
