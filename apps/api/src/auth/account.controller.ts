import { Body, Controller, Delete, HttpCode, Inject, Patch, Post, UseGuards } from "@nestjs/common";
import { type AuthenticatedUser, AuthGuard, CurrentUser } from "@repo/nestjs-auth";
import { AccountService } from "./account.service.js";
import { CsrfGuard } from "./csrf.guard.js";
import { EmailChangeService } from "./email-change.service.js";

@Controller("auth/account")
export class AccountController {
  constructor(
    @Inject(AccountService) private readonly accountService: AccountService,
    @Inject(EmailChangeService) private readonly emailChangeService: EmailChangeService,
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

  @Post("email/change-request")
  @UseGuards(AuthGuard, CsrfGuard)
  @HttpCode(200)
  async requestEmailChange(
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ status: "ok" }> {
    const { newEmail } = body as { newEmail: string };
    await this.emailChangeService.requestEmailChange(user.sub, newEmail);
    return { status: "ok" };
  }

  @Post("email/change-confirm")
  @UseGuards(CsrfGuard)
  @HttpCode(200)
  async confirmEmailChange(@Body() body: unknown): Promise<{ status: string }> {
    const { token } = body as { token: string };
    const outcome = await this.emailChangeService.confirmEmailChange(token);
    return { status: outcome };
  }
}
