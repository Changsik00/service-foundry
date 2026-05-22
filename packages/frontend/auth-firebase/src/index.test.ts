import type { FirebaseApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  getAuth,
  getIdTokenResult,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFirebaseAuthSDK } from "./index.js";

vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  getIdTokenResult: vi.fn(),
}));

const mockApp = {} as FirebaseApp;

const makeFirebaseUser = (overrides?: object) => ({
  uid: "firebase-uid-123",
  email: "test@example.com",
  getIdToken: vi.fn().mockResolvedValue("id-token-xyz"),
  ...overrides,
});

const makeFirebaseError = (code: string) => Object.assign(new Error(`Firebase: ${code}`), { code });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getAuth).mockReturnValue({
    currentUser: null,
  } as never);
});

describe("createFirebaseAuthSDK", () => {
  describe("signIn", () => {
    it("성공 — AuthResult { success: true, user, session } 반환", async () => {
      const fbUser = makeFirebaseUser();
      vi.mocked(signInWithEmailAndPassword).mockResolvedValue({
        user: fbUser,
      } as never);

      const sdk = createFirebaseAuthSDK(mockApp);
      const result = await sdk.signIn({ email: "test@example.com", password: "password123" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.user.email).toBe("test@example.com");
        expect(result.session).toBeDefined();
      }
      expect(signInWithEmailAndPassword).toHaveBeenCalledOnce();
    });

    it("auth/user-not-found → invalid_credentials", async () => {
      vi.mocked(signInWithEmailAndPassword).mockRejectedValue(
        makeFirebaseError("auth/user-not-found"),
      );

      const sdk = createFirebaseAuthSDK(mockApp);
      const result = await sdk.signIn({ email: "x@example.com", password: "pw" });

      expect(result).toEqual({ success: false, reason: "invalid_credentials" });
    });

    it("auth/too-many-requests → rate_limited", async () => {
      vi.mocked(signInWithEmailAndPassword).mockRejectedValue(
        makeFirebaseError("auth/too-many-requests"),
      );

      const sdk = createFirebaseAuthSDK(mockApp);
      const result = await sdk.signIn({ email: "x@example.com", password: "pw" });

      expect(result).toEqual({ success: false, reason: "rate_limited" });
    });
  });

  describe("signUp", () => {
    it("성공 — AuthResult { success: true } 반환", async () => {
      const fbUser = makeFirebaseUser();
      vi.mocked(createUserWithEmailAndPassword).mockResolvedValue({
        user: fbUser,
      } as never);

      const sdk = createFirebaseAuthSDK(mockApp);
      const result = await sdk.signUp({ email: "new@example.com", password: "password123" });

      expect(result.success).toBe(true);
    });

    it("auth/email-already-in-use → AppError throw", async () => {
      vi.mocked(createUserWithEmailAndPassword).mockRejectedValue(
        makeFirebaseError("auth/email-already-in-use"),
      );

      const sdk = createFirebaseAuthSDK(mockApp);
      await expect(sdk.signUp({ email: "dup@example.com", password: "pw" })).rejects.toThrow();
    });
  });

  describe("signOut", () => {
    it("firebase signOut 위임", async () => {
      vi.mocked(firebaseSignOut).mockResolvedValue();
      const sdk = createFirebaseAuthSDK(mockApp);
      await sdk.signOut();
      expect(firebaseSignOut).toHaveBeenCalledOnce();
    });
  });

  describe("getCurrentUser", () => {
    it("currentUser null → null 반환", async () => {
      vi.mocked(getAuth).mockReturnValue({ currentUser: null } as never);
      const sdk = createFirebaseAuthSDK(mockApp);
      const user = await sdk.getCurrentUser();
      expect(user).toBeNull();
    });

    it("currentUser 있음 → User 반환", async () => {
      const fbUser = makeFirebaseUser();
      vi.mocked(getAuth).mockReturnValue({ currentUser: fbUser } as never);

      const sdk = createFirebaseAuthSDK(mockApp);
      const user = await sdk.getCurrentUser();

      expect(user).not.toBeNull();
      expect(user?.email).toBe("test@example.com");
    });
  });

  describe("refresh", () => {
    it("currentUser null → null 반환", async () => {
      vi.mocked(getAuth).mockReturnValue({ currentUser: null } as never);
      const sdk = createFirebaseAuthSDK(mockApp);
      const session = await sdk.refresh();
      expect(session).toBeNull();
    });

    it("currentUser 있음 → Session 반환", async () => {
      const fbUser = makeFirebaseUser();
      vi.mocked(getAuth).mockReturnValue({ currentUser: fbUser } as never);

      const sdk = createFirebaseAuthSDK(mockApp);
      const session = await sdk.refresh();

      expect(session).not.toBeNull();
      expect(session?.userId).toBe("firebase-uid-123");
    });
  });

  describe("firebase extensions", () => {
    it("getIdTokenResult — firebase getIdTokenResult 위임", async () => {
      const fbUser = makeFirebaseUser();
      vi.mocked(getAuth).mockReturnValue({ currentUser: fbUser } as never);
      vi.mocked(getIdTokenResult).mockResolvedValue({ claims: { role: "admin" } } as never);

      const sdk = createFirebaseAuthSDK(mockApp);
      const result = await sdk.firebase.getIdTokenResult();

      expect(getIdTokenResult).toHaveBeenCalledOnce();
      expect(result).toMatchObject({ claims: { role: "admin" } });
    });

    it("getIdTokenResult — currentUser null → null 반환", async () => {
      vi.mocked(getAuth).mockReturnValue({ currentUser: null } as never);

      const sdk = createFirebaseAuthSDK(mockApp);
      const result = await sdk.firebase.getIdTokenResult();

      expect(result).toBeNull();
    });
  });
});
