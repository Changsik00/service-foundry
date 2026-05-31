import { AppError } from "@repo/errors";

export type OAuthProviderName = "google" | "kakao";

export interface OAuthProvider {
  name: OAuthProviderName;
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scopes: string[];
}

export const googleProvider: OAuthProvider = {
  name: "google",
  authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenUrl: "https://oauth2.googleapis.com/token",
  userInfoUrl: "https://www.googleapis.com/oauth2/v3/userinfo",
  scopes: ["openid", "email", "profile"],
};

export const kakaoProvider: OAuthProvider = {
  name: "kakao",
  authorizationUrl: "https://kauth.kakao.com/oauth/authorize",
  tokenUrl: "https://kauth.kakao.com/oauth/token",
  userInfoUrl: "https://kapi.kakao.com/v2/user/me",
  scopes: ["account_email", "profile_nickname"],
};

export const providers: Record<OAuthProviderName, OAuthProvider> = {
  google: googleProvider,
  kakao: kakaoProvider,
};

export function getProvider(name: string): OAuthProvider {
  const provider = providers[name as OAuthProviderName];
  // name 은 보통 라우트 파라미터(사용자 입력) → 미지 provider 는 404.
  if (!provider) {
    throw new AppError({
      code: "NOT_FOUND",
      message: `Unknown OAuth provider: ${name}`,
      statusCode: 404,
    });
  }
  return provider;
}
