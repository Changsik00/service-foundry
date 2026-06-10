import type { CoreAuthSDK } from "@repo/auth-contracts";
import { createMockAuthSDK } from "@repo/frontend-auth-testing";
import { describe, expect, it } from "vitest";

// TypeScript 컴파일 시점 검증:
// createMockAuthSDK() 반환값이 CoreAuthSDK에 할당 가능 → Firebase/Supabase SDK도 동일하게 할당 가능
const sdk: CoreAuthSDK = createMockAuthSDK();

describe("SDK swap validation — CoreAuthSDK 계약", () => {
  it("signIn 메서드 존재", () => {
    expect(typeof sdk.signIn).toBe("function");
  });

  it("signOut 메서드 존재", () => {
    expect(typeof sdk.signOut).toBe("function");
  });

  it("getCurrentUser 메서드 존재", () => {
    expect(typeof sdk.getCurrentUser).toBe("function");
  });

  it("signUp 메서드 존재", () => {
    expect(typeof sdk.signUp).toBe("function");
  });

  it("refresh 메서드 존재", () => {
    expect(typeof sdk.refresh).toBe("function");
  });

  it("기본 signIn → invalid_credentials (Mock 기본값)", async () => {
    const result = await sdk.signIn({ email: "test@example.com", password: "pw" });
    expect(result).toEqual({ success: false, reason: "invalid_credentials" });
  });

  it("기본 getCurrentUser → null (Mock 기본값)", async () => {
    const user = await sdk.getCurrentUser();
    expect(user).toBeNull();
  });
});
