import type { OAuthUserInfo } from "./token.js";

export interface OAuthUserRow {
  id: string;
  email: string;
  passwordHash: string | null;
  role: string;
  emailVerified: boolean;
  createdAt: Date;
}

export interface OAuthAccountStore {
  findUserByEmail(email: string): Promise<OAuthUserRow | undefined>;
  findOAuthAccount(
    provider: string,
    providerAccountId: string,
  ): Promise<{ userId: string } | undefined>;
  createUser(email: string): Promise<OAuthUserRow>;
  createOAuthAccount(userId: string, provider: string, providerAccountId: string): Promise<void>;
}

export async function findOrCreateOAuthUser(
  store: OAuthAccountStore,
  provider: string,
  userInfo: OAuthUserInfo,
): Promise<{ user: OAuthUserRow; isNew: boolean }> {
  const existingAccount = await store.findOAuthAccount(provider, userInfo.providerAccountId);

  if (existingAccount) {
    const user = await store.findUserByEmail(userInfo.email);
    if (!user) throw new Error("OAuth account exists but user not found");
    return { user, isNew: false };
  }

  const existingUser = await store.findUserByEmail(userInfo.email);

  if (existingUser) {
    await store.createOAuthAccount(existingUser.id, provider, userInfo.providerAccountId);
    return { user: existingUser, isNew: false };
  }

  const newUser = await store.createUser(userInfo.email);
  await store.createOAuthAccount(newUser.id, provider, userInfo.providerAccountId);
  return { user: newUser, isNew: true };
}
