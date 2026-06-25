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
import { AppError } from "@repo/errors";

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

    // 외부 노출 식별자는 public_id (ADR-0028). 내부 세션/토큰은 user.id 사용.
    return { accessToken, refreshToken, userId: user.publicId };
  }

  // 도달 시 getProvider 가 이미 검증했으므로 방어적 — raw Error 대신 AppError(전역 필터가 매핑, ADR-0027).
  private getClientId(provider: string): string {
    if (provider === "google") return this.requireEnv(provider, "GOOGLE_CLIENT_ID");
    if (provider === "kakao") return this.requireEnv(provider, "KAKAO_CLIENT_ID");
    throw new AppError({
      code: "NOT_FOUND",
      message: `Unknown provider: ${provider}`,
      statusCode: 404,
    });
  }

  private getClientSecret(provider: string): string {
    if (provider === "google") return this.requireEnv(provider, "GOOGLE_CLIENT_SECRET");
    if (provider === "kakao") return this.requireEnv(provider, "KAKAO_CLIENT_SECRET");
    throw new AppError({
      code: "NOT_FOUND",
      message: `Unknown provider: ${provider}`,
      statusCode: 404,
    });
  }

  /**
   * 설정된 provider 의 자격증명 env 를 읽되, 누락(undefined/빈 문자열)이면 fail-fast (Wa, spec-24-02).
   * 빈 시크릿으로 authorize/exchange 가 진행돼 provider 측 모호한 오류·디버깅 곤란을 막는다.
   */
  private requireEnv(provider: string, key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new AppError({
        code: "INTERNAL",
        message: `OAuth provider '${provider}' misconfigured: ${key} is not set`,
        statusCode: 500,
      });
    }
    return value;
  }
}
