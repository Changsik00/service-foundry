import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { signAccessToken } from "@repo/backend-auth-jwt";
import { DATABASE, type Database } from "@repo/nestjs-database";
import { and, eq } from "drizzle-orm";

import { memberships } from "../infra/schema/memberships.js";
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

    const accessToken = await signAccessToken(
      { sub: userId, activeOrgId: newOrgId, orgRole: membership.role },
      this.jwtService.getKeyStore(),
      { issuer: this.jwtOpts.issuer, audience: this.jwtOpts.audience },
    );
    return { accessToken };
  }
}
