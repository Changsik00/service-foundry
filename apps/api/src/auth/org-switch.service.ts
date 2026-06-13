import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
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

  async switch(userId: string, newOrgId: string): Promise<{ accessToken: string }> {
    // 멤버십 조회는 raw pool 로 실행 — ALS 트랜잭션의 app.current_org RLS 컨텍스트를
    // 우회해야 다른 org 로의 전환이 가능하다 (테넌트 격리가 대상 org 행을 차단함).
    const { rows: memberRows } = await this.database.pool.query<{ role: string }>(
      `SELECT role FROM memberships WHERE user_id = $1 AND org_id = $2`,
      [userId, newOrgId],
    );
    const membership = memberRows[0];

    if (!membership) throw new ForbiddenException("membership not found");

    // 전역 role 클레임 필수(AuthGuard 가 요구) — 누락 시 발급 토큰이 다음 요청에서 401.
    const { rows: userRows } = await this.database.pool.query<{ role: string }>(
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
