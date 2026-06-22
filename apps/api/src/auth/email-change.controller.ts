import { Body, Controller, HttpCode, Inject, Post, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { type AuthenticatedUser, AuthGuard, CurrentUser } from "@repo/nestjs-auth";

import { S_StatusOk } from "./auth-controller.shared.js";
import { CsrfGuard } from "./csrf.guard.js";
import { EmailChangeService } from "./email-change.service.js";

/** 이메일 변경 — account.controller 에서 분리 (spec-24-03, F2). URL prefix 동일(`auth/account`). */
@ApiTags("account")
@Controller("auth/account")
export class EmailChangeController {
  constructor(
    @Inject(EmailChangeService) private readonly emailChangeService: EmailChangeService,
  ) {}

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
