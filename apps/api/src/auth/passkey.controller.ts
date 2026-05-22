import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Inject,
  Post,
  Res,
  UseGuards,
} from "@nestjs/common";
import { type AuthenticatedUser, AuthGuard, CurrentUser } from "@repo/nestjs-auth";
import type { Response } from "express";
import { ZodError, z } from "zod";

import { setRefreshTokenCookie } from "./cookie.helper.js";
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
  @UseGuards(AuthGuard)
  async registerOptions(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ challengeToken: string; options: object }> {
    return this.passkeyService.generateRegisterOptions(user.sub, user.sub);
  }

  @Post("register/verify")
  @HttpCode(200)
  @UseGuards(AuthGuard)
  async registerVerify(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
  ): Promise<{ status: "ok" }> {
    try {
      const { challengeToken, credential } = RegisterVerifyInput.parse(body);
      await this.passkeyService.verifyRegister(user.sub, challengeToken, credential as never);
      return { status: "ok" };
    } catch (err) {
      if (err instanceof ZodError) throw new BadRequestException(err.issues);
      throw err;
    }
  }

  @Post("authenticate/options")
  @HttpCode(200)
  async authenticateOptions(): Promise<{ challengeToken: string; options: object }> {
    return this.passkeyService.generateAuthOptions();
  }

  @Post("authenticate/verify")
  @HttpCode(200)
  async authenticateVerify(
    @Body() body: unknown,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    try {
      const { challengeToken, credentialId, credential } = AuthVerifyInput.parse(body);
      const { accessToken, refreshToken } = await this.passkeyService.verifyAuth(
        challengeToken,
        credentialId,
        credential as never,
      );
      setRefreshTokenCookie(res, refreshToken);
      return { accessToken };
    } catch (err) {
      if (err instanceof ZodError) throw new BadRequestException(err.issues);
      throw err;
    }
  }
}
