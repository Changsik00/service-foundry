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
  if (!provider) throw new Error(`Unknown OAuth provider: ${name}`);
  return provider;
}
