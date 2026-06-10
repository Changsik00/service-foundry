import { describe, expect, it, vi } from "vitest";

vi.mock("firebase/auth", () => ({
  onAuthStateChanged: vi.fn(),
}));

import { onAuthStateChanged } from "firebase/auth";
import { connectFirebaseAuth } from "../../adapters/firebase.js";
import { createAuthStore } from "../../store.js";

type FirebaseUser = {
  uid: string;
  email: string | null;
  getIdToken: (forceRefresh?: boolean) => Promise<string>;
};

function makeFirebaseAuth(currentUser: FirebaseUser | null = null) {
  return { currentUser } as unknown as Parameters<typeof connectFirebaseAuth>[1];
}

describe("connectFirebaseAuth", () => {
  it("Firebase user 있을 때 → authenticated + token 설정", async () => {
    const mockUser: FirebaseUser = {
      uid: "firebase_uid",
      email: "user@example.com",
      getIdToken: vi.fn().mockResolvedValue("firebase_token"),
    };
    let listener: ((u: FirebaseUser | null) => void) | undefined;
    vi.mocked(onAuthStateChanged).mockImplementation((_auth, cb) => {
      listener = cb as (u: FirebaseUser | null) => void;
      return () => {};
    });

    const store = createAuthStore();
    connectFirebaseAuth(store, makeFirebaseAuth(mockUser));
    await listener!(mockUser);

    expect(store.getState().status).toBe("authenticated");
    expect(store.getState().token).toBe("firebase_token");
  });

  it("Firebase user null → unauthenticated", () => {
    let listener: ((u: FirebaseUser | null) => void) | undefined;
    vi.mocked(onAuthStateChanged).mockImplementation((_auth, cb) => {
      listener = cb as (u: FirebaseUser | null) => void;
      return () => {};
    });

    const store = createAuthStore();
    connectFirebaseAuth(store, makeFirebaseAuth(null));
    listener!(null);

    expect(store.getState().status).toBe("unauthenticated");
    expect(store.getState().token).toBeNull();
  });

  it("source.refresh → getIdToken(true) + setToken", async () => {
    const mockUser: FirebaseUser = {
      uid: "firebase_uid",
      email: "user@example.com",
      getIdToken: vi.fn().mockResolvedValueOnce("old_token").mockResolvedValueOnce("new_token"),
    };
    let listener: ((u: FirebaseUser | null) => void) | undefined;
    vi.mocked(onAuthStateChanged).mockImplementation((_auth, cb) => {
      listener = cb as (u: FirebaseUser | null) => void;
      return () => {};
    });

    const store = createAuthStore();
    const { source } = connectFirebaseAuth(store, makeFirebaseAuth(mockUser));
    await listener!(mockUser);
    expect(store.getState().token).toBe("old_token");

    await source.refresh();
    expect(store.getState().token).toBe("new_token");
    expect(mockUser.getIdToken).toHaveBeenCalledWith(true);
  });

  it("unsubscribe 반환 — 호출 시 onAuthStateChanged 구독 해제", () => {
    const unsubMock = vi.fn();
    vi.mocked(onAuthStateChanged).mockReturnValue(unsubMock);

    const store = createAuthStore();
    const { unsubscribe } = connectFirebaseAuth(store, makeFirebaseAuth());
    unsubscribe();

    expect(unsubMock).toHaveBeenCalledTimes(1);
  });
});
