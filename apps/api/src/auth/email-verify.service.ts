import { Injectable } from "@nestjs/common";
import { generateRefreshToken, hashToken } from "@repo/backend-auth-session";

import { type EmailVerifyTokenStore, InjectEmailVerifyTokenStore } from "./email-verify.stores.js";
import { InjectUserStore, type UserStore } from "./password-reset.stores.js";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class EmailVerifyService {
  constructor(
    @InjectUserStore() private readonly userStore: UserStore,
    @InjectEmailVerifyTokenStore() private readonly tokenStore: EmailVerifyTokenStore,
  ) {}

  async request(email: string): Promise<void> {
    const user = await this.userStore.findByEmail(email);
    if (!user) return;
    if (user.emailVerified) return;

    const token = generateRefreshToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

    await this.tokenStore.insert({ userId: user.id, tokenHash, expiresAt });

    // dev 편의용 토큰 로깅 — dev 외 환경에서는 raw 토큰을 절대 출력하지 않는다.
    // 근본 해소(이메일 전송 어댑터)는 phase-13 notification 포트.
    if (process.env.NODE_ENV === "development") {
      console.info(`[email-verify] (dev) token=${token} userId=${user.id}`);
    } else {
      console.info(`[email-verify] requested userId=${user.id}`);
    }
  }

  async confirm(token: string): Promise<void> {
    const tokenHash = hashToken(token);
    const row = await this.tokenStore.findByHash(tokenHash);

    if (!row) return;
    if (row.expiresAt < new Date()) return;
    if (row.usedAt !== null) return;

    await this.userStore.updateEmailVerified(row.userId);
    await this.tokenStore.markUsed(row.id, new Date());
  }
}
