import { Inject, Injectable } from "@nestjs/common";
import { generateRefreshToken, hashToken } from "@repo/backend-auth-session";
import { buildEmailVerifyEmail, type Notifier } from "@repo/backend-notification";

import { NOTIFIER } from "../notification/notifier.provider.js";
import type { ConfirmOutcome } from "./confirm-outcome.js";
import { type EmailVerifyTokenStore, InjectEmailVerifyTokenStore } from "./email-verify.stores.js";
import { FRONTEND_URL } from "./frontend-url.token.js";
import { InjectUserStore, type UserStore } from "./password-reset.stores.js";
import { EMAIL_TOKEN_TTL_MS } from "./token-ttl.constants.js";

@Injectable()
export class EmailVerifyService {
  constructor(
    @InjectUserStore() private readonly userStore: UserStore,
    @InjectEmailVerifyTokenStore() private readonly tokenStore: EmailVerifyTokenStore,
    @Inject(NOTIFIER) private readonly notifier: Notifier,
    @Inject(FRONTEND_URL) private readonly frontendUrl: string,
  ) {}

  async request(email: string): Promise<void> {
    const user = await this.userStore.findByEmail(email);
    if (!user) return;
    if (user.emailVerified) return;

    const token = generateRefreshToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + EMAIL_TOKEN_TTL_MS);

    await this.tokenStore.insert({ userId: user.id, tokenHash, expiresAt });

    const emailMsg = buildEmailVerifyEmail(token, this.frontendUrl);
    await this.notifier.sendEmail({ ...emailMsg, to: email });
  }

  async confirm(token: string): Promise<ConfirmOutcome> {
    const tokenHash = hashToken(token);
    const row = await this.tokenStore.findByHash(tokenHash);

    if (!row) return "invalid";
    if (row.expiresAt < new Date()) return "expired";
    if (row.usedAt !== null) return "used";

    await this.userStore.updateEmailVerified(row.userId);
    await this.tokenStore.markUsed(row.id, new Date());
    return "confirmed";
  }
}
