import { Controller, Get, Inject, Param, Query, Redirect, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";

import { clearRefreshTokenCookie, setRefreshTokenCookie } from "./cookie.helper.js";
import { OAuthService } from "./oauth.service.js";

const COOKIE_STATE = "oauth_state";
const COOKIE_VERIFIER = "oauth_pkce";
const COOKIE_MAX_AGE = 10 * 60 * 1000;
const COOKIE_OPTS = { httpOnly: true, sameSite: "lax" as const, maxAge: COOKIE_MAX_AGE };

@Controller("auth/oauth")
export class OAuthController {
  constructor(@Inject(OAuthService) private readonly oauthService: OAuthService) {}

  @Get(":provider")
  @Redirect()
  authorize(
    @Param("provider") provider: string,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ): { url: string; statusCode: number } {
    const redirectUri = this.buildRedirectUri(req, provider);
    const { redirectUrl, state, codeVerifier } = this.oauthService.buildAuthorizationUrl(
      provider,
      redirectUri,
    );

    res.cookie(COOKIE_STATE, state, { ...COOKIE_OPTS, path: `/auth/oauth/${provider}/callback` });
    res.cookie(COOKIE_VERIFIER, codeVerifier, {
      ...COOKIE_OPTS,
      path: `/auth/oauth/${provider}/callback`,
    });

    return { url: redirectUrl, statusCode: 302 };
  }

  @Get(":provider/callback")
  async callback(
    @Param("provider") provider: string,
    @Query("code") code: string,
    @Query("state") state: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string; userId: string }> {
    const cookieState = req.cookies?.[COOKIE_STATE] as string | undefined;
    const cookieVerifier = req.cookies?.[COOKIE_VERIFIER] as string | undefined;

    res.clearCookie(COOKIE_STATE);
    res.clearCookie(COOKIE_VERIFIER);

    const redirectUri = this.buildRedirectUri(req, provider);
    const { accessToken, refreshToken, userId } = await this.oauthService.handleCallback(
      provider,
      code,
      state,
      cookieState ?? "",
      cookieVerifier ?? "",
      redirectUri,
    );

    setRefreshTokenCookie(res, refreshToken);
    return { accessToken, userId };
  }

  private buildRedirectUri(req: Request, provider: string): string {
    const base = process.env["OAUTH_REDIRECT_BASE_URL"] ?? `${req.protocol}://${req.get("host")}`;
    return `${base}/auth/oauth/${provider}/callback`;
  }
}
