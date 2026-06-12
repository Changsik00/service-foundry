import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Optional,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import {
  EmailVerifyConfirm,
  EmailVerifyRequest,
  OrgInviteAcceptInput,
  OrgInviteInput,
  OrgSwitchInput,
  PasswordResetConfirm,
  PasswordResetRequest,
  SignInInput,
  SignUpInput,
} from "@repo/auth-contracts";
import { AuthEventBus } from "@repo/backend-auth-audit";
import type { AuthMetrics } from "@repo/backend-observability";
import { type AuthenticatedUser, AuthGuard, CurrentUser } from "@repo/nestjs-auth";
import type { Request, Response } from "express";
import { ZodError, type z } from "zod";

import type { UserRow } from "../infra/schema/index.js";
import { AUTH_METRICS } from "../metrics/auth-metrics.provider.js";
import { type AccountUserStore, InjectAccountUserStore } from "./account.stores.js";
import { clearRefreshTokenCookie, setRefreshTokenCookie } from "./cookie.helper.js";
import { setCsrfCookies } from "./csrf.cookie.js";
import { CSRF_SECRET, CsrfGuard } from "./csrf.guard.js";
import { EmailVerifyService } from "./email-verify.service.js";
import { MfaService } from "./mfa.service.js";
import { OrgInviteService } from "./org-invite.service.js";
import { type OrgMember, OrgMembersService } from "./org-members.service.js";
import { OrgSwitchService } from "./org-switch.service.js";
import { PasswordResetService } from "./password-reset.service.js";
import { type SessionInfo, SessionManagementService } from "./session-management.service.js";
import { SigninService } from "./signin.service.js";
import { SignupService } from "./signup.service.js";

function zodPipe<T>(schema: z.ZodType<T>) {
  return {
    transform(value: unknown): T {
      try {
        return schema.parse(value);
      } catch (err) {
        if (err instanceof ZodError) throw new BadRequestException(err.issues);
        throw err;
      }
    },
  };
}

function getContext(req: Request): { ip: string; userAgent: string } {
  return {
    ip: req.ip ?? "unknown",
    userAgent: (req.headers["user-agent"] as string | undefined) ?? "unknown",
  };
}

type SignResponse = {
  accessToken: string;
  user: Pick<UserRow, "id" | "email" | "role" | "createdAt">;
  csrfToken: string;
};
type SignInResponse = SignResponse | { status: "mfa_required"; mfaChallengeToken: string };

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(
    @Inject(PasswordResetService) private readonly passwordResetService: PasswordResetService,
    @Inject(EmailVerifyService) private readonly emailVerifyService: EmailVerifyService,
    @Inject(SigninService) private readonly signinService: SigninService,
    @Inject(SignupService) private readonly signupService: SignupService,
    @Inject(OrgSwitchService) private readonly orgSwitchService: OrgSwitchService,
    @Inject(OrgInviteService) private readonly orgInviteService: OrgInviteService,
    @Inject(OrgMembersService) private readonly orgMembersService: OrgMembersService,
    @Inject(AuthEventBus) private readonly eventBus: AuthEventBus,
    @Inject(AUTH_METRICS) private readonly metrics: AuthMetrics,
    @Optional() @Inject(MfaService) private readonly mfaService: MfaService | undefined,
    @Inject(CSRF_SECRET) private readonly csrfSecret: string,
    @InjectAccountUserStore() private readonly accountUserStore: AccountUserStore,
    @Inject(SessionManagementService)
    private readonly sessionManagementService: SessionManagementService,
  ) {}

  @ApiOperation({ summary: "CSRF 토큰 발급 — csrf_id·csrf_token 쿠키 설정" })
  @ApiResponse({ status: 200, description: "csrfToken 반환" })
  @Get("csrf")
  issueCsrf(@Res({ passthrough: true }) res: Response): { csrfToken: string } {
    const { csrfToken } = setCsrfCookies(res, this.csrfSecret);
    return { csrfToken };
  }

  @ApiOperation({ summary: "이메일·비밀번호 로그인" })
  @ApiHeader({ name: "X-Csrf-Token", required: true })
  @ApiResponse({ status: 200, description: "accessToken + user 반환, refresh_token 쿠키 설정" })
  @ApiResponse({ status: 401, description: "인증 실패" })
  @Post("signin")
  @UseGuards(CsrfGuard)
  @HttpCode(200)
  async signIn(
    @Body() body: unknown,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ): Promise<SignInResponse> {
    const { email, password } = zodPipe(SignInInput).transform(body);
    const ctx = getContext(req);
    this.metrics.recordLoginAttempt();
    let result: Awaited<ReturnType<SigninService["signIn"]>>;
    try {
      result = await this.signinService.signIn(email, password, ctx.ip);
    } catch (err) {
      this.metrics.recordLoginFailure();
      this.eventBus.emit({
        type: "LOGIN_FAILED",
        email,
        ip: ctx.ip,
        reason: "invalid_credentials",
      });
      throw err;
    }
    this.metrics.recordLoginSuccess();
    const { accessToken, user, refreshToken } = result;

    if (this.mfaService && (await this.mfaService.isMfaEnabled(user.id))) {
      const mfaChallengeToken = await this.mfaService.signMfaChallengeToken(user.id);
      return { status: "mfa_required", mfaChallengeToken };
    }

    setRefreshTokenCookie(res, refreshToken);
    const { csrfToken } = setCsrfCookies(res, this.csrfSecret);
    this.eventBus.emit({
      type: "SIGNED_IN",
      userId: user.id,
      sessionId: refreshToken,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      csrfToken,
    };
  }

  @ApiOperation({ summary: "이메일·비밀번호 회원 가입" })
  @ApiHeader({ name: "X-Csrf-Token", required: true })
  @ApiResponse({ status: 201, description: "accessToken + user 반환, refresh_token 쿠키 설정" })
  @ApiResponse({ status: 409, description: "이메일 중복" })
  @Post("signup")
  @UseGuards(CsrfGuard)
  @HttpCode(201)
  async signUp(
    @Body() body: unknown,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ): Promise<SignResponse> {
    const { email, password } = zodPipe(SignUpInput).transform(body);
    const ctx = getContext(req);
    const { accessToken, user, refreshToken } = await this.signupService.signUp(email, password);
    setRefreshTokenCookie(res, refreshToken);
    const { csrfToken } = setCsrfCookies(res, this.csrfSecret);
    this.eventBus.emit({
      type: "SIGNED_IN",
      userId: user.id,
      sessionId: refreshToken,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      csrfToken,
    };
  }

  @ApiOperation({ summary: "로그아웃 — refresh_token 쿠키 삭제 + 세션 revoke" })
  @ApiHeader({ name: "X-Csrf-Token", required: true })
  @ApiResponse({ status: 200, description: "로그아웃 성공" })
  @Post("signout")
  @UseGuards(CsrfGuard)
  @HttpCode(200)
  async signOut(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ status: "ok" }> {
    const token = req.cookies?.refresh_token as string | undefined;
    if (token) {
      void this.signinService.revokeSession(token).catch(() => {});
      this.eventBus.emit({ type: "SESSION_REVOKED", sessionId: token, reason: "signout" });
    }
    this.eventBus.emit({ type: "SIGNED_OUT", sessionId: token ?? "" });
    clearRefreshTokenCookie(res);
    return { status: "ok" };
  }

  @ApiOperation({ summary: "Access token 갱신 — refresh_token 쿠키 로테이션" })
  @ApiHeader({ name: "X-Csrf-Token", required: true })
  @ApiResponse({ status: 200, description: "새 accessToken + refresh_token 쿠키 갱신" })
  @ApiResponse({ status: 401, description: "refresh_token 만료·revoked·미존재" })
  @Post("refresh")
  @UseGuards(CsrfGuard)
  @HttpCode(200)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SignResponse> {
    const token = req.cookies?.refresh_token as string | undefined;
    const { accessToken, user, refreshToken } = await this.signinService.refresh(token ?? "");
    setRefreshTokenCookie(res, refreshToken);
    const { csrfToken } = setCsrfCookies(res, this.csrfSecret);
    this.eventBus.emit({ type: "TOKEN_REFRESHED", sessionId: refreshToken });
    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      csrfToken,
    };
  }

  @ApiOperation({ summary: "현재 인증된 사용자 정보 조회" })
  @ApiBearerAuth("access-token")
  @ApiResponse({ status: 200, description: "JWT 클레임 + displayName 반환" })
  @Get("me")
  @UseGuards(AuthGuard)
  async me(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<{ user: AuthenticatedUser & { displayName: string | null } }> {
    const row = await this.accountUserStore.findById(currentUser.sub);
    return { user: { ...currentUser, displayName: row?.displayName ?? null } };
  }

  // --- existing endpoints ---

  @Post("password/reset")
  @UseGuards(CsrfGuard)
  @HttpCode(200)
  async requestReset(@Body() body: unknown): Promise<{ status: "ok" }> {
    const { email } = zodPipe(PasswordResetRequest).transform(body);
    await this.passwordResetService.request(email);
    return { status: "ok" };
  }

  @Post("password/reset/confirm")
  @UseGuards(CsrfGuard)
  @HttpCode(200)
  async confirmReset(@Body() body: unknown): Promise<{ status: "ok" }> {
    const { token, newPassword } = zodPipe(PasswordResetConfirm).transform(body);
    await this.passwordResetService.confirm(token, newPassword);
    return { status: "ok" };
  }

  @Post("email/verify/request")
  @UseGuards(CsrfGuard)
  @HttpCode(200)
  async requestEmailVerify(@Body() body: unknown): Promise<{ status: "ok" }> {
    const { email } = zodPipe(EmailVerifyRequest).transform(body);
    await this.emailVerifyService.request(email);
    return { status: "ok" };
  }

  @Post("email/verify/confirm")
  @UseGuards(CsrfGuard)
  @HttpCode(200)
  async confirmEmailVerify(@Body() body: unknown): Promise<{ status: "ok" }> {
    const { token } = zodPipe(EmailVerifyConfirm).transform(body);
    await this.emailVerifyService.confirm(token);
    return { status: "ok" };
  }

  @Post("org/switch")
  @UseGuards(AuthGuard)
  @HttpCode(200)
  async orgSwitch(
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ accessToken: string }> {
    const { orgId } = zodPipe(OrgSwitchInput).transform(body);
    return this.orgSwitchService.switch(user.sub, orgId);
  }

  @Post("org/invite")
  @UseGuards(AuthGuard)
  @HttpCode(200)
  async orgInvite(
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ status: string }> {
    const { email, role } = zodPipe(OrgInviteInput).transform(body);
    if (!user.orgId) throw new BadRequestException("no active org");
    await this.orgInviteService.invite(user.sub, user.orgId, email, role);
    return { status: "ok" };
  }

  @Post("org/invite/accept")
  @UseGuards(AuthGuard)
  @HttpCode(200)
  async orgInviteAccept(
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ accessToken: string }> {
    const { token } = zodPipe(OrgInviteAcceptInput).transform(body);
    return this.orgInviteService.accept(user.sub, token);
  }

  /** active org 의 멤버 목록 — RLS 가 자동 스코프(spec-17-08 격리 검증 표면). */
  @Get("org/members")
  @UseGuards(AuthGuard)
  @HttpCode(200)
  async orgMembers(@CurrentUser() _user: AuthenticatedUser): Promise<{ members: OrgMember[] }> {
    return { members: await this.orgMembersService.list() };
  }

  @ApiOperation({ summary: "활성 세션 목록 조회 — current 세션 표시" })
  @ApiBearerAuth("access-token")
  @ApiResponse({ status: 200, description: "활성 세션 배열 (refreshTokenHash 미포함)" })
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

  @ApiOperation({ summary: "특정 세션 종료" })
  @ApiBearerAuth("access-token")
  @ApiHeader({ name: "X-Csrf-Token", required: true })
  @ApiResponse({ status: 200, description: "종료 성공" })
  @ApiResponse({ status: 403, description: "타인 세션 접근 불가" })
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

  @ApiOperation({ summary: "현재 세션 외 전체 종료" })
  @ApiBearerAuth("access-token")
  @ApiHeader({ name: "X-Csrf-Token", required: true })
  @ApiResponse({ status: 200, description: "현재 세션 제외 전체 revoke" })
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
