import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import type { OrgRole, Role } from "@repo/auth-contracts";
import { ACTIVE_ORG_CLAIM, ORG_ROLE_CLAIM, signAccessToken } from "@repo/backend-auth-jwt";
import { DATABASE, type Database } from "@repo/nestjs-database";
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

  async switch(userId: string, newOrgPublicId: string): Promise<{ accessToken: string }> {
    // 입력은 org public_id(외부 식별자) — 내부 org id 로 해석(없으면 fail-close, ADR-0029).
    // raw pool: org 전환은 현재 active org RLS 컨텍스트를 우회해야 대상 org 행이 보인다.
    const { rows: orgRows } = await this.database.pool.query<{ id: string }>(
      `SELECT id FROM organizations WHERE public_id = $1`,
      [newOrgPublicId],
    );
    const newOrgId = orgRows[0]?.id;
    if (!newOrgId) throw new ForbiddenException("org not found");

    const { rows: memberRows } = await this.database.pool.query<{ role: OrgRole }>(
      `SELECT role FROM memberships WHERE user_id = $1 AND org_id = $2`,
      [userId, newOrgId],
    );
    const membership = memberRows[0];

    if (!membership) throw new ForbiddenException("membership not found");

    // 전역 role 클레임 필수(AuthGuard 가 요구) — 누락 시 발급 토큰이 다음 요청에서 401.
    const { rows: userRows } = await this.database.pool.query<{ role: Role }>(
      `SELECT role FROM users WHERE id = $1`,
      [userId],
    );
    const user = userRows[0];
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
