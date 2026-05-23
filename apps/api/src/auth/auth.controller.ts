import {
  BadRequestException,
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
  EmailVerifyConfirm,
  EmailVerifyRequest,
  PasswordResetConfirm,
  PasswordResetRequest,
  SignInInput,
  SignUpInput,
} from "@repo/auth-contracts";
import { AuthEventBus } from "@repo/backend-auth-audit";
import { type AuthenticatedUser, AuthGuard, CurrentUser } from "@repo/nestjs-auth";
import type { Request, Response } from "express";
import { ZodError, type z } from "zod";

import type { UserRow } from "../infra/schema/index.js";
import { clearRefreshTokenCookie, setRefreshTokenCookie } from "./cookie.helper.js";
import { EmailVerifyService } from "./email-verify.service.js";
import { MfaService } from "./mfa.service.js";
import { PasswordResetService } from "./password-reset.service.js";
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
};
type SignInResponse = SignResponse | { status: "mfa_required"; mfaChallengeToken: string };

@Controller("auth")
export class AuthController {
  constructor(
    @Inject(PasswordResetService) private readonly passwordResetService: PasswordResetService,
    @Inject(EmailVerifyService) private readonly emailVerifyService: EmailVerifyService,
    @Inject(SigninService) private readonly signinService: SigninService,
    @Inject(SignupService) private readonly signupService: SignupService,
    @Inject(AuthEventBus) private readonly eventBus: AuthEventBus,
    @Optional() @Inject(MfaService) private readonly mfaService: MfaService | undefined,
  ) {}

  @Post("signin")
  @HttpCode(200)
  async signIn(
    @Body() body: unknown,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ): Promise<SignInResponse> {
    const { email, password } = zodPipe(SignInInput).transform(body);
    const ctx = getContext(req);
    let result: Awaited<ReturnType<SigninService["signIn"]>>;
    try {
      result = await this.signinService.signIn(email, password);
    } catch (err) {
      this.eventBus.emit({
        type: "LOGIN_FAILED",
        email,
        ip: ctx.ip,
        reason: "invalid_credentials",
      });
      throw err;
    }
    const { accessToken, user, refreshToken } = result;

    if (this.mfaService && (await this.mfaService.isMfaEnabled(user.id))) {
      const mfaChallengeToken = await this.mfaService.signMfaChallengeToken(user.id);
      return { status: "mfa_required", mfaChallengeToken };
    }

    setRefreshTokenCookie(res, refreshToken);
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
    };
  }

  @Post("signup")
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
    };
  }

  @Post("signout")
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

  @Post("refresh")
  @HttpCode(200)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SignResponse> {
    const token = req.cookies?.refresh_token as string | undefined;
    const { accessToken, user, refreshToken } = await this.signinService.refresh(token ?? "");
    setRefreshTokenCookie(res, refreshToken);
    this.eventBus.emit({ type: "TOKEN_REFRESHED", sessionId: refreshToken });
    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    };
  }

  @Get("me")
  @UseGuards(AuthGuard)
  me(@CurrentUser() currentUser: AuthenticatedUser): { user: AuthenticatedUser } {
    return { user: currentUser };
  }

  // --- existing endpoints ---

  @Post("password/reset")
  @HttpCode(200)
  async requestReset(@Body() body: unknown): Promise<{ status: "ok" }> {
    const { email } = zodPipe(PasswordResetRequest).transform(body);
    await this.passwordResetService.request(email);
    return { status: "ok" };
  }

  @Post("password/reset/confirm")
  @HttpCode(200)
  async confirmReset(@Body() body: unknown): Promise<{ status: "ok" }> {
    const { token, newPassword } = zodPipe(PasswordResetConfirm).transform(body);
    await this.passwordResetService.confirm(token, newPassword);
    return { status: "ok" };
  }

  @Post("email/verify/request")
  @HttpCode(200)
  async requestEmailVerify(@Body() body: unknown): Promise<{ status: "ok" }> {
    const { email } = zodPipe(EmailVerifyRequest).transform(body);
    await this.emailVerifyService.request(email);
    return { status: "ok" };
  }

  @Post("email/verify/confirm")
  @HttpCode(200)
  async confirmEmailVerify(@Body() body: unknown): Promise<{ status: "ok" }> {
    const { token } = zodPipe(EmailVerifyConfirm).transform(body);
    await this.emailVerifyService.confirm(token);
    return { status: "ok" };
  }
}
