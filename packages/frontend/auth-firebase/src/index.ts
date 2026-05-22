import type { AuthResult, CoreAuthSDK, Session, User } from "@repo/auth-contracts";
import type { FirebaseApp } from "firebase/app";
import type { IdTokenResult } from "firebase/auth";
import {
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  getAuth,
  getIdTokenResult,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { normalizeFirebaseAuthError } from "./normalize";

export interface FirebaseExtensions {
  getIdTokenResult(forceRefresh?: boolean): Promise<IdTokenResult | null>;
}

function toUser(fbUser: { uid: string; email: string | null }): User {
  return {
    id: fbUser.uid,
    email: fbUser.email ?? "",
    role: "user",
    createdAt: new Date().toISOString(),
  };
}

function toSession(fbUser: { uid: string }): Session {
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  return { userId: fbUser.uid, expiresAt };
}

export function createFirebaseAuthSDK(
  app: FirebaseApp,
): CoreAuthSDK & { firebase: FirebaseExtensions } {
  const auth = getAuth(app);

  const sdk: CoreAuthSDK & { firebase: FirebaseExtensions } = {
    async signIn(input): Promise<AuthResult> {
      try {
        const { user } = await signInWithEmailAndPassword(auth, input.email, input.password);
        return { success: true, user: toUser(user), session: toSession(user) };
      } catch (err) {
        return normalizeFirebaseAuthError(err);
      }
    },

    async signUp(input): Promise<AuthResult> {
      try {
        const { user } = await createUserWithEmailAndPassword(auth, input.email, input.password);
        return { success: true, user: toUser(user), session: toSession(user) };
      } catch (err) {
        return normalizeFirebaseAuthError(err);
      }
    },

    async signOut(): Promise<void> {
      await firebaseSignOut(auth);
    },

    async getCurrentUser(): Promise<User | null> {
      const { currentUser } = getAuth(app);
      return currentUser ? toUser(currentUser) : null;
    },

    async refresh(): Promise<Session | null> {
      const { currentUser } = getAuth(app);
      if (!currentUser) return null;
      await currentUser.getIdToken(true);
      return toSession(currentUser);
    },

    firebase: {
      async getIdTokenResult(forceRefresh?: boolean): Promise<IdTokenResult | null> {
        const { currentUser } = getAuth(app);
        if (!currentUser) return null;
        return getIdTokenResult(currentUser, forceRefresh);
      },
    },
  };

  return sdk;
}
