import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { type AuthenticatedUser, AuthGuard, CurrentUser } from "@repo/nestjs-auth";
import type { Request, Response } from "express";

import { S_SessionInfo, S_StatusOk } from "./auth-controller.shared.js";
import { setCsrfCookies } from "./csrf.cookie.js";
import { CSRF_SECRET, CsrfGuard } from "./csrf.guard.js";
import { type SessionInfo, SessionManagementService } from "./session-management.service.js";

/** CSRF 발급 + 세션 관리 — auth.controller 에서 분리 (spec-23-06). URL prefix 동일(`auth`). */
@ApiTags("auth")
@Controller("auth")
export class SessionController {
  constructor(
    @Inject(CSRF_SECRET) private readonly csrfSecret: string,
    @Inject(SessionManagementService)
    private readonly sessionManagementService: SessionManagementService,
  ) {}

  @ApiOperation({
    summary: "CSRF 토큰 발급",
    description:
      "이중 쿠키 패턴: `csrf_id`(HttpOnly) + `csrf_token`(JS 읽기 가능) 쿠키를 설정하고, " +
      "응답 body에도 csrfToken을 반환합니다. 변경성 요청 전 반드시 호출하세요.",
  })
  @ApiResponse({
    status: 200,
    description: "csrfToken 반환 (X-Csrf-Token 헤더 값으로 사용)",
    schema: {
      type: "object",
      properties: { csrfToken: { type: "string", example: "abc123xyz" } },
      required: ["csrfToken"],
    },
  })
  @Get("csrf")
  issueCsrf(@Res({ passthrough: true }) res: Response): { csrfToken: string } {
    const { csrfToken } = setCsrfCookies(res, this.csrfSecret);
    return { csrfToken };
  }

  @ApiOperation({
    summary: "활성 세션 목록 조회",
    description:
      "만료되지 않고 revoke되지 않은 세션 목록을 반환합니다. " +
      "`current: true` 항목이 현재 브라우저 세션입니다. `refreshTokenHash`는 응답에 포함되지 않습니다.",
  })
  @ApiBearerAuth("access-token")
  @ApiResponse({
    status: 200,
    description: "활성 세션 배열",
    schema: {
      type: "object",
      properties: {
        sessions: { type: "array", items: S_SessionInfo },
      },
      required: ["sessions"],
    },
  })
  @ApiResponse({ status: 401, description: "미인증" })
  @Get("sessions")
  @UseGuards(AuthGuard)
  @HttpCode(200)
  async listSessions(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<{ sessions: SessionInfo[] }> {
    const token = (req as unknown as import("express").Request).cookies?.refresh_token as
      | string
      | undefined;
    const sessions = await this.sessionManagementService.listSessions(user.sub, token);
    return { sessions };
  }

  @ApiOperation({
    summary: "특정 세션 종료",
    description:
      "세션 ID로 단일 세션을 revoke합니다. 자신의 세션만 종료할 수 있습니다. " +
      "현재 세션 종료도 가능합니다(로그아웃 대용).",
  })
  @ApiBearerAuth("access-token")
  @ApiHeader({ name: "X-Csrf-Token", required: true, description: "GET /auth/csrf 로 발급한 토큰" })
  @ApiParam({ name: "id", description: "종료할 세션 UUID", format: "uuid" })
  @ApiResponse({ status: 200, description: "세션 종료 성공", schema: S_StatusOk })
  @ApiResponse({ status: 401, description: "미인증" })
  @ApiResponse({ status: 403, description: "타인 세션 접근 불가 또는 세션 미존재" })
  @Delete("sessions/:id")
  @UseGuards(AuthGuard, CsrfGuard)
  @HttpCode(200)
  async revokeSession(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ status: "ok" }> {
    await this.sessionManagementService.revokeSession(user.sub, id);
    return { status: "ok" };
  }

  @ApiOperation({
    summary: "다른 세션 전체 종료",
    description:
      "현재 `refresh_token` 쿠키에 해당하는 세션을 제외한 모든 활성 세션을 revoke합니다. " +
      "쿠키가 없으면 전체 세션을 revoke합니다.",
  })
  @ApiBearerAuth("access-token")
  @ApiHeader({ name: "X-Csrf-Token", required: true, description: "GET /auth/csrf 로 발급한 토큰" })
  @ApiResponse({ status: 200, description: "다른 세션 전체 종료 성공", schema: S_StatusOk })
  @ApiResponse({ status: 401, description: "미인증" })
  @Delete("sessions")
  @UseGuards(AuthGuard, CsrfGuard)
  @HttpCode(200)
  async revokeOtherSessions(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<{ status: "ok" }> {
    const token = (req as unknown as import("express").Request).cookies?.refresh_token as
      | string
      | undefined;
    await this.sessionManagementService.revokeOtherSessions(user.sub, token);
    return { status: "ok" };
  }
}
