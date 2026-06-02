import { Body, Controller, HttpCode, Inject, Post, Res, UseGuards } from "@nestjs/common";
import { type AuthenticatedUser, AuthGuard, CurrentUser } from "@repo/nestjs-auth";
import type { Response } from "express";
import { z } from "zod";

import { setRefreshTokenCookie } from "./cookie.helper.js";
import { CsrfGuard } from "./csrf.guard.js";
import { MfaService } from "./mfa.service.js";

const ConfirmEnrollInput = z.object({ code: z.string().min(6).max(8) });
const VerifyInput = z.object({
  mfaChallengeToken: z.string().min(10),
  code: z.string().min(6).max(10),
});
const DisableInput = z.object({ code: z.string().min(6).max(8) });

@Controller("auth/mfa/totp")
export class MfaController {
  constructor(@Inject(MfaService) private readonly mfaService: MfaService) {}

  @Post("enroll")
  @HttpCode(200)
  @UseGuards(AuthGuard, CsrfGuard)
  async enroll(@CurrentUser() user: AuthenticatedUser): Promise<{ totpUri: string }> {
    return this.mfaService.enroll(user.sub);
  }

  @Post("enroll/confirm")
  @HttpCode(200)
  @UseGuards(AuthGuard, CsrfGuard)
  async confirmEnroll(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
  ): Promise<{ backupCodes: string[] }> {
    const { code } = ConfirmEnrollInput.parse(body);
    return this.mfaService.confirmEnroll(user.sub, code);
  }

  @Post("verify")
  @HttpCode(200)
  @UseGuards(CsrfGuard)
  async verify(
    @Body() body: unknown,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    const { mfaChallengeToken, code } = VerifyInput.parse(body);
    const { accessToken, refreshToken } = await this.mfaService.verifyMfa(mfaChallengeToken, code);
    setRefreshTokenCookie(res, refreshToken);
    return { accessToken };
  }

  @Post("disable")
  @HttpCode(200)
  @UseGuards(AuthGuard, CsrfGuard)
  async disable(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
  ): Promise<{ status: "ok" }> {
    const { code } = DisableInput.parse(body);
    await this.mfaService.disable(user.sub, code);
    return { status: "ok" };
  }
}
