import {
  ConflictException,
  ForbiddenException,
  GoneException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { signAccessToken } from "@repo/backend-auth-jwt";
import { generateRefreshToken, hashToken } from "@repo/backend-auth-session";
import { buildInvitationEmail, type Notifier } from "@repo/backend-notification";
import { DATABASE, type Database } from "@repo/nestjs-database";
import { and, eq } from "drizzle-orm";

import { invitations } from "../infra/schema/invitations.js";
import { memberships } from "../infra/schema/memberships.js";
import { organizations } from "../infra/schema/organizations.js";
import { JwtService } from "../jwt/jwt.service.js";
import { NOTIFIER } from "../notification/notifier.provider.js";
import { FRONTEND_URL } from "./frontend-url.token.js";
import { JWT_SIGN_OPTIONS, type JwtSignOptions } from "./jwt-sign.options.js";

@Injectable()
export class OrgInviteService {
  constructor(
    @Inject(DATABASE) private readonly database: Database<Record<string, unknown>>,
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(JWT_SIGN_OPTIONS) private readonly jwtOpts: JwtSignOptions,
    @Inject(NOTIFIER) private readonly notifier: Notifier,
    @Inject(FRONTEND_URL) private readonly frontendUrl: string,
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

    if (!membership || !["owner", "admin"].includes(membership.role)) {
      throw new ForbiddenException("insufficient org role");
    }

    const [org] = await this.database.db
      .select({ name: organizations.name })
      .from(organizations)
      .where(eq(organizations.id, orgId));

    const token = generateRefreshToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

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
    const tokenHash = hashToken(token);
    const [invitation] = await this.database.db
      .select()
      .from(invitations)
      .where(eq(invitations.tokenHash, tokenHash));

    if (!invitation) throw new NotFoundException("invitation not found");
    if (invitation.expiresAt < new Date()) throw new GoneException("invitation expired");
    if (invitation.acceptedAt) throw new ConflictException("invitation already accepted");

    await this.database.db.insert(memberships).values({
      userId,
      orgId: invitation.orgId,
      role: invitation.role,
    });

    await this.database.db
      .update(invitations)
      .set({ acceptedAt: new Date() })
      .where(eq(invitations.id, invitation.id));

    const accessToken = await signAccessToken(
      { sub: userId, activeOrgId: invitation.orgId, orgRole: invitation.role },
      this.jwtService.getKeyStore(),
      { issuer: this.jwtOpts.issuer, audience: this.jwtOpts.audience },
    );
    return { accessToken };
  }
}
