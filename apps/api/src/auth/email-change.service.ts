import { BadRequestException, ConflictException, Inject, Injectable } from "@nestjs/common";
import type { SessionStore } from "@repo/backend-auth-session";
import { generateRefreshToken, hashToken } from "@repo/backend-auth-session";
import { buildEmailChangeEmail, type Notifier } from "@repo/backend-notification";

import { NOTIFIER } from "../notification/notifier.provider.js";
import { type AccountUserStore, InjectAccountUserStore } from "./account.stores.js";
import type { ConfirmOutcome } from "./confirm-outcome.js";
import { type EmailChangeTokenStore, InjectEmailChangeTokenStore } from "./email-change.stores.js";
import { FRONTEND_URL } from "./frontend-url.token.js";
import { InjectSessionStore } from "./session.stores.js";
import { EMAIL_TOKEN_TTL_MS } from "./token-ttl.constants.js";

@Injectable()
export class EmailChangeService {
  constructor(
    @InjectAccountUserStore() private readonly userStore: AccountUserStore,
    @InjectEmailChangeTokenStore() private readonly tokenStore: EmailChangeTokenStore,
    @InjectSessionStore() private readonly sessionStore: SessionStore,
    @Inject(NOTIFIER) private readonly notifier: Notifier,
    @Inject(FRONTEND_URL) private readonly frontendUrl: string,
  ) {}

  async requestEmailChange(userId: string, newEmail: string): Promise<void> {
    const user = await this.userStore.findById(userId);
    if (!user) throw new BadRequestException("사용자를 찾을 수 없습니다");
    if (user.providerUid !== null) {
      throw new BadRequestException("소셜 로그인 계정은 이메일을 변경할 수 없습니다");
    }

    const existing = await this.userStore.findByEmail(newEmail);
    if (existing) throw new ConflictException("이미 사용 중인 이메일입니다");

    const token = generateRefreshToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + EMAIL_TOKEN_TTL_MS);

    await this.tokenStore.insert({ userId, newEmail, tokenHash, expiresAt });

    const emailMsg = buildEmailChangeEmail(token, this.frontendUrl);
    await this.notifier.sendEmail({ ...emailMsg, to: newEmail });
  }

  async confirmEmailChange(token: string): Promise<ConfirmOutcome> {
    const tokenHash = hashToken(token);
    const row = await this.tokenStore.findByHash(tokenHash);

    if (!row) return "invalid";
    if (row.expiresAt < new Date()) return "expired";
    if (row.usedAt !== null) return "used";

    const existing = await this.userStore.findByEmail(row.newEmail);
    if (existing) throw new ConflictException("이미 사용 중인 이메일입니다");

    await this.userStore.updateEmail(row.userId, row.newEmail);
    await this.tokenStore.markUsed(row.id, new Date());
    await this.sessionStore.revokeAllByUser(row.userId);
    return "confirmed";
  }
}
