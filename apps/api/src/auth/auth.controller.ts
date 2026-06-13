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
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
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
import {
  type AuthenticatedUser,
  AuthGuard,
  CurrentUser,
  OrgRoles,
  OrgRolesGuard,
} from "@repo/nestjs-auth";
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
import { type MemberListResult, type OrgMember, OrgMembersService } from "./org-members.service.js";
import { OrgSwitchService } from "./org-switch.service.js";
import { PasswordResetService } from "./password-reset.service.js";
import { type SessionInfo, SessionManagementService } from "./session-management.service.js";
import { SigninService } from "./signin.service.js";
import { SignupService } from "./signup.service.js";

// ── Swagger inline schemas ────────────────────────────────────────────────

const S_User = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid", example: "550e8400-e29b-41d4-a716-446655440000" },
    email: { type: "string", format: "email", example: "user@example.com" },
    role: { type: "string", enum: ["user", "admin"], example: "user" },
    createdAt: { type: "string", format: "date-time", example: "2024-01-01T00:00:00.000Z" },
  },
  required: ["id", "email", "role", "createdAt"],
};

const S_SignResponse = {
  type: "object",
  description: "로그인·회원가입·토큰 갱신 공통 응답",
  properties: {
    accessToken: {
      type: "string",
      description: "JWT Bearer token. Authorization: Bearer <token> 헤더에 포함. 기본 만료: 15분.",
      example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    },
    user: S_User,
    csrfToken: {
      type: "string",
      description: "변경성 요청(POST/PATCH/DELETE) 시 X-Csrf-Token 헤더에 포함 필요.",
      example: "abc123xyz",
    },
  },
  required: ["accessToken", "user", "csrfToken"],
};

const S_SessionInfo = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid", example: "550e8400-e29b-41d4-a716-446655440000" },
    createdAt: { type: "string", format: "date-time", example: "2024-01-01T00:00:00.000Z" },
    expiresAt: { type: "string", format: "date-time", example: "2024-01-31T00:00:00.000Z" },
    orgId: {
      type: "string",
      format: "uuid",
      nullable: true,
      example: "660e8400-e29b-41d4-a716-446655440000",
      description: "활성 org 컨텍스트 없으면 null.",
    },
    current: {
      type: "boolean",
      description: "현재 요청을 보낸 세션(refresh_token 쿠키 기준)이면 true.",
      example: true,
    },
  },
  required: ["id", "createdAt", "expiresAt", "current"],
};

const S_StatusOk = {
  type: "object",
  properties: { status: { type: "string", enum: ["ok"], example: "ok" } },
  required: ["status"],
};

// ─────────────────────────────────────────────────────────────────────────────

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
    summary: "이메일·비밀번호 로그인",
    description:
      "성공 시 `refresh_token` HttpOnly 쿠키를 설정하고 accessToken + user를 반환합니다. " +
      "MFA가 활성화된 계정은 `mfa_required` 상태와 `mfaChallengeToken`을 반환합니다.",
  })
  @ApiHeader({ name: "X-Csrf-Token", required: true, description: "GET /auth/csrf 로 발급한 토큰" })
  @ApiBody({
    description: "로그인 자격증명",
    schema: {
      type: "object",
      properties: {
        email: { type: "string", format: "email", example: "user@example.com" },
        password: {
          type: "string",
          minLength: 8,
          maxLength: 128,
          example: "Secure@123",
          description: "최소 8자, 최대 128자",
        },
      },
      required: ["email", "password"],
    },
  })
  @ApiResponse({
    status: 200,
    description: "로그인 성공 또는 MFA 필요",
    schema: {
      oneOf: [
        { ...S_SignResponse },
        {
          type: "object",
          description: "MFA 인증이 필요한 경우",
          properties: {
            status: { type: "string", enum: ["mfa_required"], example: "mfa_required" },
            mfaChallengeToken: {
              type: "string",
              description: "MFA 검증 엔드포인트에 전달할 단기 토큰",
            },
          },
          required: ["status", "mfaChallengeToken"],
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: "이메일·비밀번호 불일치 또는 계정 잠금" })
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

  @ApiOperation({
    summary: "이메일·비밀번호 회원 가입",
    description:
      "가입과 동시에 로그인 처리 — `refresh_token` 쿠키 설정 + accessToken 반환. " +
      "`displayName`은 선택 항목입니다.",
  })
  @ApiHeader({ name: "X-Csrf-Token", required: true, description: "GET /auth/csrf 로 발급한 토큰" })
  @ApiBody({
    description: "회원 가입 정보",
    schema: {
      type: "object",
      properties: {
        email: { type: "string", format: "email", example: "user@example.com" },
        password: {
          type: "string",
          minLength: 8,
          maxLength: 128,
          example: "Secure@123",
          description: "최소 8자, 최대 128자",
        },
        displayName: {
          type: "string",
          minLength: 1,
          maxLength: 100,
          example: "홍길동",
          description: "표시 이름 (선택). 미입력 시 null로 저장.",
        },
      },
      required: ["email", "password"],
    },
  })
  @ApiResponse({ status: 201, description: "가입 성공", schema: S_SignResponse })
  @ApiResponse({ status: 409, description: "이미 가입된 이메일" })
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

  @ApiOperation({
    summary: "로그아웃",
    description:
      "`refresh_token` 쿠키를 삭제하고 해당 세션을 revoke합니다. " +
      "토큰이 없어도 200을 반환합니다 (멱등성 보장).",
  })
  @ApiHeader({ name: "X-Csrf-Token", required: true, description: "GET /auth/csrf 로 발급한 토큰" })
  @ApiResponse({ status: 200, description: "로그아웃 성공", schema: S_StatusOk })
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

  @ApiOperation({
    summary: "Access token 갱신",
    description:
      "`refresh_token` HttpOnly 쿠키를 읽어 새 accessToken과 rotate된 refresh_token을 발급합니다. " +
      "token rotation: 기존 refresh_token은 즉시 무효화됩니다.",
  })
  @ApiHeader({ name: "X-Csrf-Token", required: true, description: "GET /auth/csrf 로 발급한 토큰" })
  @ApiResponse({ status: 200, description: "토큰 갱신 성공", schema: S_SignResponse })
  @ApiResponse({
    status: 401,
    description: "refresh_token 쿠키 없음 · 만료 · revoked · 재사용 감지(family 격리)",
  })
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

  @ApiOperation({
    summary: "현재 인증된 사용자 정보 조회",
    description:
      "Authorization Bearer token의 JWT 클레임과 DB에서 조회한 displayName을 반환합니다.",
  })
  @ApiBearerAuth("access-token")
  @ApiResponse({
    status: 200,
    description: "사용자 정보",
    schema: {
      type: "object",
      properties: {
        user: {
          type: "object",
          properties: {
            sub: { type: "string", format: "uuid", description: "사용자 ID (JWT subject)" },
            email: { type: "string", format: "email", example: "user@example.com" },
            role: { type: "string", enum: ["user", "admin"], example: "user" },
            orgId: {
              type: "string",
              format: "uuid",
              nullable: true,
              description: "활성 org 없으면 null",
            },
            displayName: {
              type: "string",
              nullable: true,
              example: "홍길동",
              description: "프로필 이름. 미설정 시 null.",
            },
          },
          required: ["sub", "email", "role"],
        },
      },
      required: ["user"],
    },
  })
  @ApiResponse({ status: 401, description: "토큰 없음·만료·서명 불일치" })
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
  @UseGuards(AuthGuard, OrgRolesGuard)
  @OrgRoles("admin", "owner")
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
  async orgMembers(@CurrentUser() _user: AuthenticatedUser): Promise<MemberListResult> {
    return this.orgMembersService.list();
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
