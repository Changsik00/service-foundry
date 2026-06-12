import { Body, Controller, Delete, HttpCode, Inject, Patch, Post, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { type AuthenticatedUser, AuthGuard, CurrentUser } from "@repo/nestjs-auth";
import { AccountService } from "./account.service.js";
import { CsrfGuard } from "./csrf.guard.js";
import { EmailChangeService } from "./email-change.service.js";

const S_StatusOk = {
  type: "object",
  properties: { status: { type: "string", enum: ["ok"], example: "ok" } },
  required: ["status"],
};

@ApiTags("account")
@Controller("auth/account")
export class AccountController {
  constructor(
    @Inject(AccountService) private readonly accountService: AccountService,
    @Inject(EmailChangeService) private readonly emailChangeService: EmailChangeService,
  ) {}

  @ApiOperation({
    summary: "비밀번호 변경",
    description: "현재 비밀번호를 검증한 뒤 새 비밀번호로 교체합니다. 세션은 유지됩니다.",
  })
  @ApiBearerAuth("access-token")
  @ApiHeader({ name: "X-Csrf-Token", required: true, description: "GET /auth/csrf 로 발급한 토큰" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        currentPassword: { type: "string", example: "OldPass@123", description: "현재 비밀번호" },
        newPassword: {
          type: "string",
          minLength: 8,
          maxLength: 128,
          example: "NewPass@456",
          description: "새 비밀번호 (최소 8자, 최대 128자)",
        },
      },
      required: ["currentPassword", "newPassword"],
    },
  })
  @ApiResponse({ status: 200, description: "변경 성공", schema: S_StatusOk })
  @ApiResponse({ status: 401, description: "현재 비밀번호 불일치 또는 미인증" })
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

  @ApiOperation({
    summary: "프로필 변경",
    description: "표시 이름(displayName)을 업데이트합니다.",
  })
  @ApiBearerAuth("access-token")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        displayName: {
          type: "string",
          minLength: 1,
          maxLength: 100,
          example: "홍길동",
          description: "새 표시 이름",
        },
      },
      required: ["displayName"],
    },
  })
  @ApiResponse({ status: 200, description: "변경 성공", schema: S_StatusOk })
  @ApiResponse({ status: 401, description: "미인증" })
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

  @ApiOperation({
    summary: "계정 탈퇴",
    description:
      "계정을 soft-delete 처리합니다. 모든 활성 세션이 즉시 revoke됩니다. " +
      "조직의 단독 owner인 경우 다른 멤버에게 소유권을 이전한 뒤 탈퇴해야 합니다.",
  })
  @ApiBearerAuth("access-token")
  @ApiHeader({ name: "X-Csrf-Token", required: true, description: "GET /auth/csrf 로 발급한 토큰" })
  @ApiResponse({ status: 200, description: "탈퇴 성공", schema: S_StatusOk })
  @ApiResponse({ status: 401, description: "미인증" })
  @ApiResponse({
    status: 409,
    description: "조직 단독 owner — 소유권 이전 후 재시도",
    schema: {
      type: "object",
      properties: { message: { type: "string", example: "단독 owner는 탈퇴할 수 없습니다" } },
    },
  })
  @Delete()
  @UseGuards(AuthGuard, CsrfGuard)
  @HttpCode(200)
  async deleteAccount(@CurrentUser() user: AuthenticatedUser): Promise<{ status: "ok" }> {
    await this.accountService.deleteAccount(user.sub);
    return { status: "ok" };
  }

  @ApiOperation({
    summary: "이메일 변경 요청",
    description:
      "새 이메일로 인증 메일을 발송합니다. 메일의 링크 클릭 시 `/email/change-confirm`을 호출하세요. " +
      "소셜(OAuth) 계정은 이메일 변경이 불가합니다.",
  })
  @ApiBearerAuth("access-token")
  @ApiHeader({ name: "X-Csrf-Token", required: true, description: "GET /auth/csrf 로 발급한 토큰" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        newEmail: {
          type: "string",
          format: "email",
          example: "new@example.com",
          description: "변경할 새 이메일 주소",
        },
      },
      required: ["newEmail"],
    },
  })
  @ApiResponse({ status: 200, description: "인증 메일 발송 완료", schema: S_StatusOk })
  @ApiResponse({ status: 400, description: "소셜(OAuth) 계정 — 이메일 변경 불가" })
  @ApiResponse({ status: 401, description: "미인증" })
  @ApiResponse({ status: 409, description: "이미 다른 계정에서 사용 중인 이메일" })
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

  @ApiOperation({
    summary: "이메일 변경 확인",
    description:
      "인증 메일의 토큰을 검증하고 이메일을 갱신합니다. " +
      "status 필드로 결과를 확인하세요 — `confirmed` 외에는 모두 실패 케이스입니다.",
  })
  @ApiHeader({ name: "X-Csrf-Token", required: true, description: "GET /auth/csrf 로 발급한 토큰" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        token: {
          type: "string",
          minLength: 20,
          example: "aBcDeFgHiJkLmNoPqRsT",
          description: "인증 메일에 포함된 토큰",
        },
      },
      required: ["token"],
    },
  })
  @ApiResponse({
    status: 200,
    description: "토큰 처리 결과 (성공/실패 모두 200)",
    schema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["confirmed", "invalid", "expired", "used"],
          description:
            "`confirmed`: 변경 완료. `invalid`: 토큰 불일치. `expired`: 만료. `used`: 이미 사용됨.",
          example: "confirmed",
        },
      },
      required: ["status"],
    },
  })
  @Post("email/change-confirm")
  @UseGuards(CsrfGuard)
  @HttpCode(200)
  async confirmEmailChange(@Body() body: unknown): Promise<{ status: string }> {
    const { token } = body as { token: string };
    const outcome = await this.emailChangeService.confirmEmailChange(token);
    return { status: outcome };
  }
}
