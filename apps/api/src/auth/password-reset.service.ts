import { Inject, Injectable } from "@nestjs/common";
import { hashPassword } from "@repo/backend-auth-password";
import { generateRefreshToken, hashToken } from "@repo/backend-auth-session";
import type { Notifier } from "@repo/backend-notification";

import { NOTIFIER } from "../notification/notifier.provider.js";
import type { ConfirmOutcome } from "./confirm-outcome.js";
import {
  InjectTokenStore,
  InjectUserStore,
  type PasswordResetTokenStore,
  type UserStore,
} from "./password-reset.stores.js";

const TOKEN_TTL_MS = 15 * 60 * 1000;

@Injectable()
export class PasswordResetService {
  constructor(
    @InjectUserStore() private readonly userStore: UserStore,
    @InjectTokenStore() private readonly tokenStore: PasswordResetTokenStore,
    @Inject(NOTIFIER) private readonly notifier: Notifier,
  ) {}

  async request(email: string): Promise<void> {
    const user = await this.userStore.findByEmail(email);
    if (!user) return;

    const token = generateRefreshToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

    await this.tokenStore.insert({ userId: user.id, tokenHash, expiresAt });

    // 전송은 notification 포트로 위임 — dev 어댑터는 로그(가시성), 비-dev noop(토큰 미로깅).
    await this.notifier.sendEmail({
      to: email,
      subject: "비밀번호 재설정",
      body: `비밀번호 재설정 토큰: ${token}`,
    });
  }

  async confirm(token: string, newPassword: string): Promise<ConfirmOutcome> {
    const tokenHash = hashToken(token);
    const row = await this.tokenStore.findByHash(tokenHash);

    if (!row) return "invalid";
    if (row.expiresAt < new Date()) return "expired";
    if (row.usedAt !== null) return "used";

    const passwordHash = await hashPassword(newPassword);
    await this.userStore.updatePasswordHash(row.userId, passwordHash);
    await this.tokenStore.markUsed(row.id, new Date());
    return "confirmed";
  }
}
