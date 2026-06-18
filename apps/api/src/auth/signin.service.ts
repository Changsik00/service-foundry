import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ACTIVE_ORG_CLAIM, ORG_ROLE_CLAIM, signAccessToken } from "@repo/backend-auth-jwt";
import { verifyPassword } from "@repo/backend-auth-password";
import {
  checkRateLimit,
  evaluateLockout,
  isLocked,
  recordFailure,
  recordSuccess,
} from "@repo/backend-auth-rate-limit";
import {
  createSession,
  hashToken,
  revokeSession as revokeSessionFn,
  rotateSession,
} from "@repo/backend-auth-session";
import { DATABASE, type Database } from "@repo/nestjs-database";
import { and, eq } from "drizzle-orm";
import type { UserRow } from "../infra/schema/index.js";
import { memberships } from "../infra/schema/memberships.js";
import { JwtService } from "../jwt/jwt.service.js";
import { JWT_SIGN_OPTIONS, type JwtSignOptions } from "./jwt-sign.options.js";
import { InjectUserStore, type UserStore } from "./password-reset.stores.js";
import { InjectRateLimitStore, type RateLimitStore } from "./rate-limit.stores.js";
import { InjectSessionStore, type SessionStore } from "./session.stores.js";

@Injectable()
export class SigninService {
  constructor(
    @InjectUserStore() private readonly userStore: UserStore,
    @InjectSessionStore() private readonly sessionStore: SessionStore,
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(JWT_SIGN_OPTIONS) private readonly jwtOpts: JwtSignOptions,
    @InjectRateLimitStore() private readonly rateLimitStore: RateLimitStore,
    @Inject(DATABASE) private readonly database: Database<Record<string, unknown>>,
  ) {}

  /**
   * 사용자의 home org(`users.org_id`) 클레임을 만든다. activeOrgId 는 테넌트 컨텍스트의
   * SoT 이므로 반드시 포함되어야 한다(없으면 요청이 무컨텍스트가 됨, spec-17-08 C-2).
   * orgRole 은 home org 멤버십 role(개인 워크스페이스는 owner).
   */
  private async orgClaims(user: UserRow): Promise<Record<string, string>> {
    if (!user.orgId) return {};
    const [m] = await this.database.db
      .select({ role: memberships.role })
      .from(memberships)
      .where(and(eq(memberships.userId, user.id), eq(memberships.orgId, user.orgId)));
    return {
      [ACTIVE_ORG_CLAIM]: user.orgId,
      ...(m ? { [ORG_ROLE_CLAIM]: m.role } : {}),
    };
  }

  async signIn(
    email: string,
    password: string,
    ip: string,
  ): Promise<{ accessToken: string; user: UserRow; refreshToken: string }> {
    const accountKey = email;
    const ctx = { ip, accountKey };

    // 1) 잠금/레이트리밋 선검사 — 통과 못 하면 비밀번호 검증 비용 없이 429.
    const locked = await isLocked(this.rateLimitStore, accountKey);
    if (locked.locked) {
      throw new HttpException("too many login attempts", HttpStatus.TOO_MANY_REQUESTS);
    }
    const decision = await checkRateLimit(this.rateLimitStore, ctx);
    if (!decision.allowed) {
      throw new HttpException("too many login attempts", HttpStatus.TOO_MANY_REQUESTS);
    }

    // 2) 비밀번호 검증 — 실패 시 실패 기록 + lockout 평가 후 401.
    const user = await this.userStore.findByEmail(email);
    const valid = user?.passwordHash ? await verifyPassword(password, user.passwordHash) : false;
    if (!user || !user.passwordHash || !valid) {
      await recordFailure(this.rateLimitStore, ctx);
      await evaluateLockout(this.rateLimitStore, { accountKey });
      throw new UnauthorizedException("invalid credentials");
    }

    // 3) 성공 — 실패 카운터 리셋 + lockout 해제.
    await recordSuccess(this.rateLimitStore, accountKey);

    // createSession 과 orgClaims 는 서로 독립이므로 병렬 실행.
    const [{ refreshToken }, claims] = await Promise.all([
      createSession(this.sessionStore, { userId: user.id }),
      this.orgClaims(user),
    ]);
    const accessToken = await signAccessToken(
      { sub: user.id, role: user.role, ...claims },
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
      { sub: user.id, role: user.role, ...(await this.orgClaims(user)) },
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
