import type { Session, User } from "@repo/auth-contracts";
import { describe, expect, it } from "vitest";
import { createMockAuthSDK } from "./index.js";

const TEST_USER: User = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "test@example.com",
  role: "user",
  createdAt: "2026-01-01T00:00:00.000Z",
};

const TEST_SESSION: Session = {
  userId: "00000000-0000-0000-0000-000000000001",
  expiresAt: "2026-01-01T01:00:00.000Z",
};

describe("createMockAuthSDK", () => {
  // ── 기본 상태 ────────────────────────────────────────────────────────────

  it("기본 currentUser는 null", async () => {
    const sdk = createMockAuthSDK();
    expect(await sdk.getCurrentUser()).toBeNull();
  });

  it("기본 signInResult는 invalid_credentials", async () => {
    const sdk = createMockAuthSDK();
    const result = await sdk.signIn({ email: "a@b.com", password: "pw" });
    expect(result).toEqual({ success: false, reason: "invalid_credentials" });
  });

  // ── signIn ───────────────────────────────────────────────────────────────

  it("signIn 성공 → _state.currentUser 업데이트 + _calls 기록", async () => {
    const sdk = createMockAuthSDK({
      signInResult: { success: true, user: TEST_USER, session: TEST_SESSION },
    });

    const result = await sdk.signIn({ email: "test@example.com", password: "pw" });

    expect(result.success).toBe(true);
    expect(sdk._state.currentUser).toEqual(TEST_USER);
    expect(sdk._calls.signIn).toHaveLength(1);
    expect(sdk._calls.signIn[0]).toEqual({ email: "test@example.com", password: "pw" });
  });

  it("signIn 실패 → currentUser 변경 없음 + 호출 기록", async () => {
    const sdk = createMockAuthSDK();
    await sdk.signIn({ email: "a@b.com", password: "pw" });
    expect(sdk._state.currentUser).toBeNull();
    expect(sdk._calls.signIn).toHaveLength(1);
  });

  // ── signUp ───────────────────────────────────────────────────────────────

  it("signUp 성공 → _state.currentUser 업데이트", async () => {
    const sdk = createMockAuthSDK({
      signUpResult: { success: true, user: TEST_USER, session: TEST_SESSION },
    });

    const result = await sdk.signUp({ email: "new@example.com", password: "pw" });

    expect(result.success).toBe(true);
    expect(sdk._state.currentUser).toEqual(TEST_USER);
    expect(sdk._calls.signUp).toHaveLength(1);
  });

  it("signUp 실패 → AuthResult { success: false }", async () => {
    const sdk = createMockAuthSDK();
    const result = await sdk.signUp({ email: "a@b.com", password: "pw" });
    expect(result.success).toBe(false);
  });

  // ── signOut ──────────────────────────────────────────────────────────────

  it("signOut → currentUser null + signOutCount 증가", async () => {
    const sdk = createMockAuthSDK({ currentUser: TEST_USER });
    await sdk.signOut();
    expect(sdk._state.currentUser).toBeNull();
    expect(sdk._calls.signOutCount).toBe(1);
  });

  // ── getCurrentUser ───────────────────────────────────────────────────────

  it("getCurrentUser → _state.currentUser 반환 + count 증가", async () => {
    const sdk = createMockAuthSDK({ currentUser: TEST_USER });
    const user = await sdk.getCurrentUser();
    expect(user).toEqual(TEST_USER);
    expect(sdk._calls.getCurrentUserCount).toBe(1);
  });

  // ── refresh ──────────────────────────────────────────────────────────────

  it("refresh null → null 반환 + count 증가", async () => {
    const sdk = createMockAuthSDK();
    const session = await sdk.refresh();
    expect(session).toBeNull();
    expect(sdk._calls.refreshCount).toBe(1);
  });

  it("refresh → _state.refreshResult 반환", async () => {
    const sdk = createMockAuthSDK({ refreshResult: TEST_SESSION });
    const session = await sdk.refresh();
    expect(session).toEqual(TEST_SESSION);
  });

  // ── _reset ───────────────────────────────────────────────────────────────

  it("_reset → 상태와 호출 기록 초기화", async () => {
    const sdk = createMockAuthSDK({ currentUser: TEST_USER });
    await sdk.signOut();
    await sdk.getCurrentUser();
    sdk._reset();

    expect(sdk._state.currentUser).toBeNull();
    expect(sdk._calls.signOutCount).toBe(0);
    expect(sdk._calls.getCurrentUserCount).toBe(0);
    expect(sdk._calls.signIn).toHaveLength(0);
  });

  // ── initial override ─────────────────────────────────────────────────────

  it("createMockAuthSDK(initial) — currentUser 오버라이드", async () => {
    const sdk = createMockAuthSDK({ currentUser: TEST_USER });
    const user = await sdk.getCurrentUser();
    expect(user).toEqual(TEST_USER);
  });

  // ── MFA/Passkey 스텁 ──────────────────────────────────────────────────────

  it("verifyMfaTotp → throw Error", async () => {
    const sdk = createMockAuthSDK();
    await expect(sdk.verifyMfaTotp("token", "123456")).rejects.toThrow();
  });

  it("fetchPasskeyRegisterOptions → throw Error", async () => {
    const sdk = createMockAuthSDK();
    await expect(sdk.fetchPasskeyRegisterOptions()).rejects.toThrow();
  });
});
