import {
  ConflictException,
  ForbiddenException,
  GoneException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ACTIVE_ORG_CLAIM, ORG_ROLE_CLAIM, signAccessToken } from "@repo/backend-auth-jwt";
import { generateRefreshToken, hashToken } from "@repo/backend-auth-session";
import { canInviteMember } from "@repo/backend-authz";
import { buildInvitationEmail, type Notifier } from "@repo/backend-notification";
import { runWithSystemTenant, TENANT_ALS, type TenantAls } from "@repo/backend-tenant";
import { DATABASE, type Database } from "@repo/nestjs-database";
import { and, eq } from "drizzle-orm";
import { invitations } from "../infra/schema/invitations.js";
import { memberships } from "../infra/schema/memberships.js";
import { organizations } from "../infra/schema/organizations.js";
import { users } from "../infra/schema/users.js";
import { JwtService } from "../jwt/jwt.service.js";
import { NOTIFIER } from "../notification/notifier.provider.js";
import { FRONTEND_URL } from "./frontend-url.token.js";
import { JWT_SIGN_OPTIONS, type JwtSignOptions } from "./jwt-sign.options.js";
import { EMAIL_TOKEN_TTL_MS } from "./token-ttl.constants.js";

@Injectable()
export class OrgInviteService {
  constructor(
    @Inject(DATABASE) private readonly database: Database<Record<string, unknown>>,
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(JWT_SIGN_OPTIONS) private readonly jwtOpts: JwtSignOptions,
    @Inject(NOTIFIER) private readonly notifier: Notifier,
    @Inject(FRONTEND_URL) private readonly frontendUrl: string,
    @Inject(TENANT_ALS) private readonly als: TenantAls,
  ) {}

  async invite(
    inviterId: string,
    orgId: string,
    email: string,
    role: "admin" | "member",
  ): Promise<void> {
    const [membership] = await this.database.db
      .select()
      .from(memberships)
      .where(and(eq(memberships.userId, inviterId), eq(memberships.orgId, orgId)));

    if (!membership || !canInviteMember(membership.role)) {
      throw new ForbiddenException("insufficient org role");
    }

    const [org] = await this.database.db
      .select({ name: organizations.name })
      .from(organizations)
      .where(eq(organizations.id, orgId));

    const token = generateRefreshToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + EMAIL_TOKEN_TTL_MS);

    await this.database.db.insert(invitations).values({
      orgId,
      email,
      tokenHash,
      role,
      invitedBy: inviterId,
      expiresAt,
    });

    const emailMsg = buildInvitationEmail(org?.name ?? orgId, token, this.frontendUrl);
    await this.notifier.sendEmail({ ...emailMsg, to: email });
  }

  async accept(userId: string, token: string): Promise<{ accessToken: string }> {
    const accepted = await this.acceptCore(userId, token);

    const accessToken = await signAccessToken(
      {
        sub: userId,
        role: accepted.userRole,
        [ACTIVE_ORG_CLAIM]: accepted.orgId,
        [ORG_ROLE_CLAIM]: accepted.orgRole,
      },
      this.jwtService.getKeyStore(),
      { issuer: this.jwtOpts.issuer, audience: this.jwtOpts.audience },
    );
    return { accessToken };
  }

  /** provider 모드 수락 — 멤버십 생성 + active org 전환(users.orgId, ADR-0026). 토큰 불변 */
  async acceptForProvider(providerUid: string, token: string): Promise<{ orgId: string }> {
    const userId = await this.resolveInternalUserId(providerUid);
    const accepted = await this.acceptCore(userId, token);
    await runWithSystemTenant(this.als, async () => {
      await this.database.db
        .update(users)
        .set({ orgId: accepted.orgId })
        .where(eq(users.id, userId));
    });
    return { orgId: accepted.orgId };
  }

  /** provider 모드 초대 — providerUid 를 내부 유저로 해석 후 위임 */
  async inviteForProvider(
    providerUid: string,
    orgId: string,
    email: string,
    role: "admin" | "member",
  ): Promise<void> {
    const userId = await this.resolveInternalUserId(providerUid);
    return this.invite(userId, orgId, email, role);
  }

  private async resolveInternalUserId(providerUid: string): Promise<string> {
    return runWithSystemTenant(this.als, async () => {
      const [user] = await this.database.db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.providerUid, providerUid));
      if (!user) throw new ForbiddenException("user not found");
      return user.id;
    });
  }

  /**
   * 수락 코어 — 검증(만료/중복/이메일 바인딩 C-5) + 멤버십 생성. native/provider 공용.
   * 초대는 *수락자의* org 가 아닌 *초대한* org 소유 → 수락자 컨텍스트로는 RLS 에 가린다.
   * 토큰 자체가 인가이므로 시스템 컨텍스트로 조회/쓰기한다 (같은 tx → 원자성 유지, C-4).
   */
  private async acceptCore(
    userId: string,
    token: string,
  ): Promise<{ orgId: string; orgRole: "admin" | "member"; userRole: string }> {
    const tokenHash = hashToken(token);

    return runWithSystemTenant(this.als, async () => {
      const [invitation] = await this.database.db
        .select()
        .from(invitations)
        .where(eq(invitations.tokenHash, tokenHash));

      if (!invitation) throw new NotFoundException("invitation not found");
      if (invitation.expiresAt < new Date()) throw new GoneException("invitation expired");
      if (invitation.acceptedAt) throw new ConflictException("invitation already accepted");

      // C-5: 토큰-이메일 바인딩 — 초대 대상 이메일과 수락 유저 이메일이 일치해야 한다.
      const [user] = await this.database.db
        .select({ email: users.email, role: users.role })
        .from(users)
        .where(eq(users.id, userId));
      if (!user || user.email !== invitation.email) {
        throw new ForbiddenException("invitation email mismatch");
      }

      // C-5: 멤버십 중복 거부 (unique idx 보강 — 명확한 409).
      const [existing] = await this.database.db
        .select({ id: memberships.id })
        .from(memberships)
        .where(and(eq(memberships.userId, userId), eq(memberships.orgId, invitation.orgId)));
      if (existing) throw new ConflictException("already a member of this org");

      await this.database.db.insert(memberships).values({
        userId,
        orgId: invitation.orgId,
        role: invitation.role,
      });
      await this.database.db
        .update(invitations)
        .set({ acceptedAt: new Date() })
        .where(eq(invitations.id, invitation.id));

      return { orgId: invitation.orgId, orgRole: invitation.role, userRole: user.role };
    });
  }
}
