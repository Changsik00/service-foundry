import { randomUUID } from "node:crypto";
import { BadRequestException, Injectable } from "@nestjs/common";
import { hashPassword, verifyPassword } from "@repo/backend-auth-password";
import type { AccountUserStore } from "./account.stores.js";
import { InjectAccountUserStore } from "./account.stores.js";
import type { SessionStore } from "./session.stores.js";
import { InjectSessionStore } from "./session.stores.js";

@Injectable()
export class AccountService {
  constructor(
    @InjectAccountUserStore() private readonly userStore: AccountUserStore,
    @InjectSessionStore() private readonly sessionStore: SessionStore,
  ) {}

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userStore.findById(userId);
    if (!user?.passwordHash) throw new BadRequestException("비밀번호를 설정한 계정이 아닙니다");
    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestException("현재 비밀번호가 올바르지 않습니다");
    const newHash = await hashPassword(newPassword);
    await this.userStore.updatePasswordHash(userId, newHash);
  }

  async updateProfile(userId: string, displayName: string): Promise<void> {
    await this.userStore.updateDisplayName(userId, displayName);
  }

  async deleteAccount(userId: string): Promise<void> {
    const isSoleOwner = await this.userStore.isSoleOwnerOfAnyOrg(userId);
    if (isSoleOwner) {
      throw new BadRequestException(
        "ACCOUNT_DELETE_BLOCKED: 단독 owner 인 조직이 있습니다. owner 를 위임한 뒤 탈퇴하세요.",
      );
    }
    const user = await this.userStore.findById(userId);
    if (!user) throw new BadRequestException("사용자를 찾을 수 없습니다");
    const maskedEmail = `${user.email}#deleted_${randomUUID()}`;
    await this.userStore.softDelete(userId, maskedEmail);
    await this.sessionStore.revokeAllByUser(userId);
  }
}
