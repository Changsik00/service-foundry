import { Body, Controller, Delete, HttpCode, Inject, Patch, UseGuards } from "@nestjs/common";
import { type AuthenticatedUser, AuthGuard, CurrentUser } from "@repo/nestjs-auth";
import { AccountService } from "./account.service.js";
import { CSRF_SECRET, CsrfGuard } from "./csrf.guard.js";

@Controller("auth/account")
export class AccountController {
  constructor(
    @Inject(AccountService) private readonly accountService: AccountService,
    @Inject(CSRF_SECRET) private readonly csrfSecret: string,
  ) {}

  @Patch("password")
  @UseGuards(AuthGuard)
  @HttpCode(200)
  async changePassword(
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ status: "ok" }> {
    const { currentPassword, newPassword } = body as {
      currentPassword: string;
      newPassword: string;
    };
    await this.accountService.changePassword(user.sub, currentPassword, newPassword);
    return { status: "ok" };
  }

  @Patch("profile")
  @UseGuards(AuthGuard)
  @HttpCode(200)
  async updateProfile(
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ status: "ok" }> {
    const { displayName } = body as { displayName: string };
    await this.accountService.updateProfile(user.sub, displayName);
    return { status: "ok" };
  }

  @Delete()
  @UseGuards(AuthGuard, CsrfGuard)
  @HttpCode(200)
  async deleteAccount(@CurrentUser() user: AuthenticatedUser): Promise<{ status: "ok" }> {
    await this.accountService.deleteAccount(user.sub);
    return { status: "ok" };
  }
}
