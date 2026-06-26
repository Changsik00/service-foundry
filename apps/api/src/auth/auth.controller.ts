import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Optional,
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
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import {
  EmailVerifyConfirm,
  EmailVerifyRequest,
  PasswordResetConfirm,
  PasswordResetRequest,
  SignInInput,
  SignUpInput,
} from "@repo/auth-contracts";
import { AuthEventBus } from "@repo/backend-auth-audit";
import type { AuthMetrics } from "@repo/backend-observability";
import { type AuthenticatedUser, AuthGuard, CurrentUser } from "@repo/nestjs-auth";
import type { Request, Response } from "express";
import { AUTH_METRICS } from "../metrics/auth-metrics.provider.js";
import { type AccountUserStore, InjectAccountUserStore } from "./account.stores.js";
import {
  getContext,
  S_SignResponse,
  S_StatusOk,
  type SignInResponse,
  type SignResponse,
  zodPipe,
} from "./auth-controller.shared.js";
import { clearRefreshTokenCookie, setRefreshTokenCookie } from "./cookie.helper.js";
import { setCsrfCookies } from "./csrf.cookie.js";
import { CSRF_SECRET, CsrfGuard } from "./csrf.guard.js";
import { EmailVerifyService } from "./email-verify.service.js";
import { MfaService } from "./mfa.service.js";
import { PasswordResetService } from "./password-reset.service.js";
import { SigninService } from "./signin.service.js";
import { SignupService } from "./signup.service.js";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(
    @Inject(PasswordResetService) private readonly passwordResetService: PasswordResetService,
    @Inject(EmailVerifyService) private readonly emailVerifyService: EmailVerifyService,
    @Inject(SigninService) private readonly signinService: SigninService,
    @Inject(SignupService) private readonly signupService: SignupService,
    @Inject(AuthEventBus) private readonly eventBus: AuthEventBus,
    @Inject(AUTH_METRICS) private readonly metrics: AuthMetrics,
    @Optional() @Inject(MfaService) private readonly mfaService: MfaService | undefined,
    @Inject(CSRF_SECRET) private readonly csrfSecret: string,
    @InjectAccountUserStore() private readonly accountUserStore: AccountUserStore,
  ) {}

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
        id: user.publicId,
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
        id: user.publicId,
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
      await this.signinService.revokeSession(token).catch(() => {});
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
        id: user.publicId,
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
  async me(@CurrentUser() currentUser: AuthenticatedUser): Promise<{
    user: {
      id: string | null;
      email: string | null;
      role: AuthenticatedUser["role"];
      orgId: string | null;
      orgRole: AuthenticatedUser["orgRole"];
      displayName: string | null;
    };
  }> {
    // sub(=내부 users.id, 서버 전용)·active_org(내부 org id)은 응답에 노출하지 않는다 — 외부 식별자는 public_id (ADR-0028).
    const row = await this.accountUserStore.findById(currentUser.sub);
    const orgPublicId = currentUser.orgId
      ? await this.accountUserStore.findOrgPublicId(currentUser.orgId)
      : null;
    return {
      user: {
        id: row?.publicId ?? null,
        email: row?.email ?? null,
        role: currentUser.role,
        orgId: orgPublicId,
        orgRole: currentUser.orgRole,
        displayName: row?.displayName ?? null,
      },
    };
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
}
