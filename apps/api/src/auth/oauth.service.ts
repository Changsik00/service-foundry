import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { signAccessToken } from "@repo/backend-auth-jwt";
import type { OAuthAccountStore } from "@repo/backend-auth-oauth";
import {
  exchangeCode,
  fetchUserInfo,
  findOrCreateOAuthUser,
  generateCodeChallenge,
  generateCodeVerifier,
  generateState,
  getProvider,
  verifyState,
} from "@repo/backend-auth-oauth";
import { createSession } from "@repo/backend-auth-session";

import { JwtService } from "../jwt/jwt.service.js";
import { JWT_SIGN_OPTIONS, type JwtSignOptions } from "./jwt-sign.options.js";
import { OAUTH_ACCOUNT_STORE } from "./oauth.stores.js";
import { InjectSessionStore, type SessionStore } from "./session.stores.js";

export interface OAuthRedirectResult {
  redirectUrl: string;
  state: string;
  codeVerifier: string;
}

@Injectable()
export class OAuthService {
  constructor(
    @Inject(OAUTH_ACCOUNT_STORE) private readonly oauthStore: OAuthAccountStore,
    @InjectSessionStore() private readonly sessionStore: SessionStore,
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(JWT_SIGN_OPTIONS) private readonly jwtOpts: JwtSignOptions,
  ) {}

  buildAuthorizationUrl(providerName: string, redirectUri: string): OAuthRedirectResult {
    const provider = getProvider(providerName);
    const state = generateState();
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);

    const params = new URLSearchParams({
      response_type: "code",
      client_id: this.getClientId(providerName),
      redirect_uri: redirectUri,
      scope: provider.scopes.join(" "),
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    return {
      redirectUrl: `${provider.authorizationUrl}?${params.toString()}`,
      state,
      codeVerifier,
    };
  }

  async handleCallback(
    providerName: string,
    code: string,
    stateParam: string,
    cookieState: string,
    cookieVerifier: string,
    redirectUri: string,
  ): Promise<{ accessToken: string; refreshToken: string; userId: string }> {
    if (!verifyState(stateParam, cookieState)) {
      throw new UnauthorizedException("OAuth state mismatch");
    }

    const provider = getProvider(providerName);
    const tokens = await exchangeCode(provider, {
      code,
      codeVerifier: cookieVerifier,
      redirectUri,
      clientId: this.getClientId(providerName),
      clientSecret: this.getClientSecret(providerName),
    });

    const userInfo = await fetchUserInfo(provider, tokens.accessToken);
    const { user } = await findOrCreateOAuthUser(this.oauthStore, providerName, userInfo);

    const { refreshToken } = await createSession(this.sessionStore, { userId: user.id });
    const accessToken = await signAccessToken(
      { sub: user.id, role: user.role },
      this.jwtService.getKeyStore(),
      { issuer: this.jwtOpts.issuer, audience: this.jwtOpts.audience },
    );

    return { accessToken, refreshToken, userId: user.id };
  }

  private getClientId(provider: string): string {
    if (provider === "google") return process.env["GOOGLE_CLIENT_ID"] ?? "";
    if (provider === "kakao") return process.env["KAKAO_CLIENT_ID"] ?? "";
    throw new Error(`Unknown provider: ${provider}`);
  }

  private getClientSecret(provider: string): string {
    if (provider === "google") return process.env["GOOGLE_CLIENT_SECRET"] ?? "";
    if (provider === "kakao") return process.env["KAKAO_CLIENT_SECRET"] ?? "";
    throw new Error(`Unknown provider: ${provider}`);
  }
}
