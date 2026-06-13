import { randomUUID } from "node:crypto";
import { BadRequestException, Inject, Injectable, Optional } from "@nestjs/common";
import { hashPassword, verifyPassword } from "@repo/backend-auth-password";
import type { Storage } from "@repo/backend-storage";
import type { AccountUserStore } from "./account.stores.js";
import { InjectAccountUserStore } from "./account.stores.js";
import type { SessionStore } from "./session.stores.js";
import { InjectSessionStore } from "./session.stores.js";

export const STORAGE = Symbol("STORAGE");

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 2 * 1024 * 1024;

@Injectable()
export class AccountService {
  constructor(
    @InjectAccountUserStore() private readonly userStore: AccountUserStore,
    @InjectSessionStore() private readonly sessionStore: SessionStore,
    @Optional() @Inject(STORAGE) private readonly storage: Storage | null = null,
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

  async updateAvatar(userId: string, buffer: Buffer, contentType: string): Promise<string> {
    if (buffer.byteLength > MAX_BYTES) {
      throw new BadRequestException("파일 크기는 2 MB 이하여야 합니다");
    }
    if (!ALLOWED_MIME.has(contentType)) {
      throw new BadRequestException("JPEG, PNG, WebP 형식만 허용됩니다");
    }
    if (!this.storage) {
      throw new BadRequestException("스토리지가 설정되지 않았습니다");
    }
    const key = userId;
    await this.storage.put(key, new Uint8Array(buffer), { contentType });
    const url = this.storage.url(key);
    await this.userStore.updateAvatarUrl(userId, url);
    return url;
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
