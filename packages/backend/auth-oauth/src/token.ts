import { AppError } from "@repo/errors";
import { fetch } from "undici";

import type { OAuthProvider } from "./providers.js";

export interface OAuthTokens {
  accessToken: string;
}

/**
 * provider 판별 union — google 은 name(선택) 제공, kakao 는 name 필드 없음.
 * `provider` 로 narrowing 하면 필드 가용성이 타입으로 보장된다.
 */
export type OAuthUserInfo =
  | { provider: "google"; providerAccountId: string; email: string; name?: string }
  | { provider: "kakao"; providerAccountId: string; email: string };

export interface ExchangeCodeOptions {
  code: string;
  codeVerifier: string;
  redirectUri: string;
  clientId: string;
  clientSecret: string;
}

export async function exchangeCode(
  provider: OAuthProvider,
  options: ExchangeCodeOptions,
): Promise<OAuthTokens> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: options.code,
    redirect_uri: options.redirectUri,
    client_id: options.clientId,
    client_secret: options.clientSecret,
    code_verifier: options.codeVerifier,
  });

  const res = await fetch(provider.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    throw new AppError({
      code: "OAUTH_TOKEN_EXCHANGE_FAILED",
      message: `OAuth token exchange failed: ${res.status}`,
      statusCode: 502,
    });
  }

  const data = (await res.json()) as Record<string, unknown>;
  const accessToken = data.access_token;
  if (typeof accessToken !== "string") {
    throw new AppError({
      code: "OAUTH_TOKEN_MISSING",
      message: "OAuth token response missing access_token",
      statusCode: 502,
    });
  }

  return { accessToken };
}

export async function fetchUserInfo(
  provider: OAuthProvider,
  accessToken: string,
): Promise<OAuthUserInfo> {
  const res = await fetch(provider.userInfoUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new AppError({
      code: "OAUTH_USERINFO_FAILED",
      message: `OAuth userinfo request failed: ${res.status}`,
      statusCode: 502,
    });
  }

  const data = (await res.json()) as Record<string, unknown>;

  if (provider.name === "kakao") {
    return extractKakaoUserInfo(data);
  }
  return extractGoogleUserInfo(data);
}

function extractGoogleUserInfo(data: Record<string, unknown>): OAuthUserInfo {
  const sub = data.sub;
  const email = data.email;
  const name = data.name;
  if (typeof sub !== "string" || typeof email !== "string") {
    throw new AppError({
      code: "OAUTH_USERINFO_INVALID",
      message: "Google userinfo missing sub or email",
      statusCode: 502,
    });
  }
  return {
    provider: "google",
    providerAccountId: sub,
    email,
    ...(typeof name === "string" ? { name } : {}),
  };
}

function extractKakaoUserInfo(data: Record<string, unknown>): OAuthUserInfo {
  const id = data.id;
  const account = data.kakao_account as Record<string, unknown> | undefined;
  const email = account?.email;
  if (typeof id !== "number" || typeof email !== "string") {
    throw new AppError({
      code: "OAUTH_USERINFO_INVALID",
      message: "Kakao userinfo missing id or email",
      statusCode: 502,
    });
  }
  return { provider: "kakao", providerAccountId: String(id), email };
}
