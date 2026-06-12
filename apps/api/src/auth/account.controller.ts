import { Body, Controller, Delete, HttpCode, Inject, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { type AuthenticatedUser, AuthGuard, CurrentUser } from "@repo/nestjs-auth";
import { AccountService } from "./account.service.js";
import { CsrfGuard } from "./csrf.guard.js";
import { EmailChangeService } from "./email-change.service.js";

@ApiTags("account")
@Controller("auth/account")
export class AccountController {
  constructor(
    @Inject(AccountService) private readonly accountService: AccountService,
    @Inject(EmailChangeService) private readonly emailChangeService: EmailChangeService,
  ) {}

  @ApiOperation({ summary: "비밀번호 변경" })
  @ApiBearerAuth("access-token")
  @ApiHeader({ name: "X-Csrf-Token", required: true })
  @ApiResponse({ status: 200, description: "변경 성공" })
  @ApiResponse({ status: 401, description: "현재 비밀번호 불일치" })
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

  @ApiOperation({ summary: "프로필(표시 이름) 변경" })
  @ApiBearerAuth("access-token")
  @ApiResponse({ status: 200, description: "변경 성공" })
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

  @ApiOperation({ summary: "계정 탈퇴 (soft-delete)" })
  @ApiBearerAuth("access-token")
  @ApiHeader({ name: "X-Csrf-Token", required: true })
  @ApiResponse({ status: 200, description: "탈퇴 성공" })
  @ApiResponse({ status: 409, description: "org 단독 owner — 탈퇴 불가" })
  @Delete()
  @UseGuards(AuthGuard, CsrfGuard)
  @HttpCode(200)
  async deleteAccount(@CurrentUser() user: AuthenticatedUser): Promise<{ status: "ok" }> {
    await this.accountService.deleteAccount(user.sub);
    return { status: "ok" };
  }

  @ApiOperation({ summary: "이메일 변경 요청 — 인증 메일 발송" })
  @ApiBearerAuth("access-token")
  @ApiHeader({ name: "X-Csrf-Token", required: true })
  @ApiResponse({ status: 200, description: "인증 메일 발송 완료" })
  @ApiResponse({ status: 400, description: "소셜 계정 — 이메일 변경 불가" })
  @ApiResponse({ status: 409, description: "이미 사용 중인 이메일" })
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

  @ApiOperation({ summary: "이메일 변경 확인 — 토큰 검증 후 이메일 갱신" })
  @ApiHeader({ name: "X-Csrf-Token", required: true })
  @ApiResponse({ status: 200, description: "confirmed | invalid | expired | used" })
  @Post("email/change-confirm")
  @UseGuards(CsrfGuard)
  @HttpCode(200)
  async confirmEmailChange(@Body() body: unknown): Promise<{ status: string }> {
    const { token } = body as { token: string };
    const outcome = await this.emailChangeService.confirmEmailChange(token);
    return { status: outcome };
  }
}
