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
    // sub 의미가 모드별로 다름(native=내부 id, supabase=providerUid) → 둘 다 시도해 내부 user 해석.
    // 응답엔 내부 id 미노출 — 외부 식별자는 public_id (ADR-0028).
    const profile =
      (await this.userStore.findById(user.sub)) ??
      (await this.userStore.findByProviderUid(user.sub));
    return {
      user: {
        id: profile?.publicId ?? null,
        email: profile?.email ?? null,
        role: user.role,
        orgId: user.orgId,
        orgRole: user.orgRole,
        displayName: profile?.displayName ?? null,
        avatarUrl: profile?.avatarUrl ?? null,
      },
    };
  }
}
