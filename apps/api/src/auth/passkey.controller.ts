import { Body, Controller, HttpCode, Inject, Post, Res, UseGuards } from "@nestjs/common";
import { type AuthenticatedUser, AuthGuard, CurrentUser } from "@repo/nestjs-auth";
import type { Response } from "express";
import { z } from "zod";

import { zodPipe } from "./auth-controller.shared.js";
import { setRefreshTokenCookie } from "./cookie.helper.js";
import { CsrfGuard } from "./csrf.guard.js";
import { PasskeyService } from "./passkey.service.js";

const RegisterVerifyInput = z.object({
  challengeToken: z.string().uuid(),
  credential: z.unknown(),
});

const AuthVerifyInput = z.object({
  challengeToken: z.string().uuid(),
  credentialId: z.string().min(1),
  credential: z.unknown(),
});

@Controller("auth/passkey")
export class PasskeyController {
  constructor(@Inject(PasskeyService) private readonly passkeyService: PasskeyService) {}

  @Post("register/options")
  @HttpCode(200)
  @UseGuards(AuthGuard, CsrfGuard)
  async registerOptions(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ challengeToken: string; options: object }> {
    return this.passkeyService.generateRegisterOptions(user.sub, user.sub);
  }

  @Post("register/verify")
  @HttpCode(200)
  @UseGuards(AuthGuard, CsrfGuard)
  async registerVerify(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
  ): Promise<{ status: "ok" }> {
    const { challengeToken, credential } = zodPipe(RegisterVerifyInput).transform(body);
    await this.passkeyService.verifyRegister(user.sub, challengeToken, credential as never);
    return { status: "ok" };
  }

  @Post("authenticate/options")
  @HttpCode(200)
  @UseGuards(CsrfGuard)
  async authenticateOptions(): Promise<{ challengeToken: string; options: object }> {
    return this.passkeyService.generateAuthOptions();
  }

  @Post("authenticate/verify")
  @HttpCode(200)
  @UseGuards(CsrfGuard)
  async authenticateVerify(
    @Body() body: unknown,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    const { challengeToken, credentialId, credential } = zodPipe(AuthVerifyInput).transform(body);
    const { accessToken, refreshToken } = await this.passkeyService.verifyAuth(
      challengeToken,
      credentialId,
      credential as never,
    );
    setRefreshTokenCookie(res, refreshToken);
    return { accessToken };
  }
}
