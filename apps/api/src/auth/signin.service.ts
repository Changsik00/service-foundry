import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { signAccessToken } from "@repo/backend-auth-jwt";
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

import type { UserRow } from "../infra/schema/index.js";
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
  ) {}

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
