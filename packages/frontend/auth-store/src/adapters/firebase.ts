import type { AuthSource } from "@repo/auth-contracts";
import type { Auth as FirebaseAuth, User as FirebaseUser } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { createAuthSource } from "../source.js";
import type { AuthStore } from "../store.js";

interface ConnectFirebaseResult {
  source: AuthSource;
  unsubscribe: () => void;
}

export function connectFirebaseAuth(store: AuthStore, auth: FirebaseAuth): ConnectFirebaseResult {
  let currentFirebaseUser: FirebaseUser | null = null;

  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    currentFirebaseUser = firebaseUser;
    if (!firebaseUser) {
      store.getState().setUnauthenticated();
      return;
    }
    const token = await firebaseUser.getIdToken();
    // Firebase user에서 User 계약 변환 — 앱이 /me API로 User를 채우기 전까지 최소 정보 사용
    store.getState().setAuthenticated(
      {
        id: firebaseUser.uid,
        email: firebaseUser.email ?? "",
        role: "user",
        createdAt: firebaseUser.metadata?.creationTime ?? new Date().toISOString(),
      },
      token,
    );
  });

  const source = createAuthSource(store, {
    refresh: async () => {
      if (!currentFirebaseUser) throw new Error("Firebase: no current user");
      const token = await currentFirebaseUser.getIdToken(true);
      store.getState().setToken(token);
    },
  });

  return { source, unsubscribe };
}
