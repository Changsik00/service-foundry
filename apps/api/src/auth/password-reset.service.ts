import { Injectable } from "@nestjs/common";
import { hashPassword } from "@repo/backend-auth-password";
import { generateRefreshToken, hashToken } from "@repo/backend-auth-session";

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
  ) {}

  async request(email: string): Promise<void> {
    const user = await this.userStore.findByEmail(email);
    if (!user) return;

    const token = generateRefreshToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

    await this.tokenStore.insert({ userId: user.id, tokenHash, expiresAt });

    console.info(`[password-reset] token=${token} userId=${user.id}`);
  }

  async confirm(token: string, newPassword: string): Promise<void> {
    const tokenHash = hashToken(token);
    const row = await this.tokenStore.findByHash(tokenHash);

    if (!row) return;
    if (row.expiresAt < new Date()) return;
    if (row.usedAt !== null) return;

    const passwordHash = await hashPassword(newPassword);
    await this.userStore.updatePasswordHash(row.userId, passwordHash);
    await this.tokenStore.markUsed(row.id, new Date());
  }
}
