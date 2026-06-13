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
    user: AuthenticatedUser & { displayName: string | null; avatarUrl: string | null };
  }> {
    const profile = await this.userStore.findById(user.sub);
    return {
      user: {
        ...user,
        displayName: profile?.displayName ?? null,
        avatarUrl: profile?.avatarUrl ?? null,
      },
    };
  }
}
