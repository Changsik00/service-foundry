import { Controller, Get, UseGuards } from "@nestjs/common";
import { type AuthenticatedUser, AuthGuard, CurrentUser } from "@repo/nestjs-auth";
import type { AccountUserStore } from "./account.stores.js";
import { InjectAccountUserStore } from "./account.stores.js";

@Controller("auth")
export class ProviderMeController {
  constructor(@InjectAccountUserStore() private readonly userStore: AccountUserStore) {}

  @Get("me")
  @UseGuards(AuthGuard)
  async me(@CurrentUser() user: AuthenticatedUser): Promise<{
    user: {
      id: string | null;
      email: string | null;
      role: AuthenticatedUser["role"];
      orgId: string | null;
      orgRole: AuthenticatedUser["orgRole"];
      displayName: string | null;
      avatarUrl: string | null;
    };
  }> {
    // sub 는 내부 users.id 로 정규화됨(spec-x-auth-sub-normalize) → findById 단일.
    // 응답엔 내부 id 미노출 — 외부 식별자는 public_id (ADR-0028).
    const profile = await this.userStore.findById(user.sub);
    const orgPublicId = user.orgId ? await this.userStore.findOrgPublicId(user.orgId) : null;
    return {
      user: {
        id: profile?.publicId ?? null,
        email: profile?.email ?? null,
        role: user.role,
        orgId: orgPublicId,
        orgRole: user.orgRole,
        displayName: profile?.displayName ?? null,
        avatarUrl: profile?.avatarUrl ?? null,
      },
    };
  }
}
