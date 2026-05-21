import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from "@nestjs/common";
import {
  EmailVerifyConfirm,
  EmailVerifyRequest,
  PasswordResetConfirm,
  PasswordResetRequest,
  SignInInput,
  SignUpInput,
} from "@repo/auth-contracts";
import { type AuthenticatedUser, AuthGuard, CurrentUser } from "@repo/nestjs-auth";
import type { Request, Response } from "express";
import type { z } from "zod";

import type { UserRow } from "../infra/schema/index.js";
import { clearRefreshTokenCookie, setRefreshTokenCookie } from "./cookie.helper.js";
// biome-ignore lint/style/useImportType: NestJS decorator metadata requires runtime value
import { EmailVerifyService } from "./email-verify.service.js";
// biome-ignore lint/style/useImportType: NestJS decorator metadata requires runtime value
import { PasswordResetService } from "./password-reset.service.js";
// biome-ignore lint/style/useImportType: NestJS decorator metadata requires runtime value
import { SigninService } from "./signin.service.js";
// biome-ignore lint/style/useImportType: NestJS decorator metadata requires runtime value
import { SignupService } from "./signup.service.js";

function zodPipe<T>(schema: z.ZodType<T>) {
  return {
    transform(value: unknown): T {
      return schema.parse(value);
    },
  };
}

type SignResponse = { accessToken: string; user: Pick<UserRow, "id" | "email" | "role"> };

@Controller("auth")
export class AuthController {
  constructor(
    private readonly passwordResetService: PasswordResetService,
    private readonly emailVerifyService: EmailVerifyService,
    private readonly signinService: SigninService,
    private readonly signupService: SignupService,
  ) {}

  @Post("signin")
  @HttpCode(200)
  async signIn(
    @Body() body: unknown,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SignResponse> {
    const { email, password } = zodPipe(SignInInput).transform(body);
    const { accessToken, user, refreshToken } = await this.signinService.signIn(email, password);
    setRefreshTokenCookie(res, refreshToken);
    return { accessToken, user: { id: user.id, email: user.email, role: user.role } };
  }

  @Post("signup")
  @HttpCode(201)
  async signUp(
    @Body() body: unknown,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SignResponse> {
    const { email, password } = zodPipe(SignUpInput).transform(body);
    const { accessToken, user, refreshToken } = await this.signupService.signUp(email, password);
    setRefreshTokenCookie(res, refreshToken);
    return { accessToken, user: { id: user.id, email: user.email, role: user.role } };
  }

  @Post("signout")
  @HttpCode(200)
  async signOut(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ status: "ok" }> {
    const token = req.cookies?.refresh_token as string | undefined;
    if (token) {
      // fire-and-forget: revoke is best-effort; cookie is always cleared
      void this.signinService.revokeSession(token).catch(() => {});
    }
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
    return { accessToken, user: { id: user.id, email: user.email, role: user.role } };
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
