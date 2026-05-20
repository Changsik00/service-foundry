import { match } from "ts-pattern";
import { describe, expect, it } from "vitest";
import {
  type AuthResult,
  EmailVerifyConfirm,
  EmailVerifyRequest,
  JwtPayload,
  type MfaChallenge,
  PasswordResetConfirm,
  PasswordResetRequest,
  RefreshInput,
  Role,
  Session,
  SignInInput,
  SignUpInput,
  User,
} from "./index.js";

const validUser = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "user@example.com",
  role: "user" as const,
  createdAt: "2026-05-18T10:00:00.000Z",
};

const validSession = {
  userId: "550e8400-e29b-41d4-a716-446655440000",
  expiresAt: "2026-05-19T10:00:00.000Z",
};

describe("Role", () => {
  it("'user' / 'admin' 을 통과시킨다", () => {
    expect(Role.safeParse("user").success).toBe(true);
    expect(Role.safeParse("admin").success).toBe(true);
  });

  it("정의되지 않은 role을 거부한다", () => {
    expect(Role.safeParse("superuser").success).toBe(false);
  });
});

describe("User", () => {
  it("valid User를 통과시킨다", () => {
    expect(User.safeParse(validUser).success).toBe(true);
  });

  it("email 형식 위반을 거부한다", () => {
    expect(User.safeParse({ ...validUser, email: "not-an-email" }).success).toBe(false);
  });
});

describe("Session", () => {
  it("valid Session을 통과시킨다", () => {
    expect(Session.safeParse(validSession).success).toBe(true);
  });
});

describe("JwtPayload", () => {
  it("valid JwtPayload를 통과시킨다", () => {
    const result = JwtPayload.safeParse({
      sub: "550e8400-e29b-41d4-a716-446655440000",
      role: "admin",
      iat: 1715000000,
      exp: 1715086400,
    });
    expect(result.success).toBe(true);
  });

  it("iat 비정수를 거부한다", () => {
    const result = JwtPayload.safeParse({
      sub: "550e8400-e29b-41d4-a716-446655440000",
      role: "user",
      iat: 1715000000.5,
      exp: 1715086400,
    });
    expect(result.success).toBe(false);
  });
});

describe("SignInInput", () => {
  it("valid 통과", () => {
    expect(SignInInput.safeParse({ email: "u@x.com", password: "12345678" }).success).toBe(true);
  });

  it("password 8자 미만 거부", () => {
    expect(SignInInput.safeParse({ email: "u@x.com", password: "short" }).success).toBe(false);
  });

  it("email 형식 위반 거부", () => {
    expect(SignInInput.safeParse({ email: "not-email", password: "12345678" }).success).toBe(false);
  });
});

describe("SignUpInput", () => {
  it("displayName 없이 통과", () => {
    expect(SignUpInput.safeParse({ email: "u@x.com", password: "12345678" }).success).toBe(true);
  });

  it("displayName 박혀도 통과", () => {
    expect(
      SignUpInput.safeParse({
        email: "u@x.com",
        password: "12345678",
        displayName: "Alice",
      }).success,
    ).toBe(true);
  });
});

describe("RefreshInput", () => {
  it("valid token 통과", () => {
    expect(RefreshInput.safeParse({ refreshToken: "a".repeat(20) }).success).toBe(true);
  });

  it("token 20자 미만 거부", () => {
    expect(RefreshInput.safeParse({ refreshToken: "short" }).success).toBe(false);
  });
});

describe("PasswordReset / EmailVerify schema", () => {
  it("PasswordResetRequest: { email } 통과", () => {
    expect(PasswordResetRequest.safeParse({ email: "u@x.com" }).success).toBe(true);
  });

  it("PasswordResetConfirm: { token, newPassword } 통과", () => {
    expect(
      PasswordResetConfirm.safeParse({
        token: "a".repeat(20),
        newPassword: "12345678",
      }).success,
    ).toBe(true);
  });

  it("EmailVerifyRequest: { email } 통과", () => {
    expect(EmailVerifyRequest.safeParse({ email: "u@x.com" }).success).toBe(true);
  });

  it("EmailVerifyConfirm: { token } 통과", () => {
    expect(EmailVerifyConfirm.safeParse({ token: "a".repeat(20) }).success).toBe(true);
  });
});

describe("MfaChallenge", () => {
  it("interface 형태 검증 (compile-time)", () => {
    const ch: MfaChallenge = {
      challengeId: "ch_1",
      method: "totp",
      expiresAt: "2026-05-20T10:00:00.000Z",
    };
    expect(ch.method).toBe("totp");
  });
});

describe("AuthResult discriminated union (ts-pattern)", () => {
  function describe_(r: AuthResult): string {
    return match(r)
      .with({ success: true }, ({ user }) => `signed_in:${user.email}`)
      .with(
        { success: false, reason: "mfa_required" },
        ({ challenge }) => `mfa:${challenge.method}`,
      )
      .with({ success: false, reason: "invalid_credentials" }, () => "invalid")
      .with({ success: false, reason: "rate_limited" }, () => "rate_limited")
      .with({ success: false, reason: "account_locked" }, () => "locked")
      .with({ success: false, reason: "unverified_email" }, () => "unverified")
      .exhaustive();
  }

  it("success → user 표시", () => {
    const r: AuthResult = { success: true, user: validUser, session: validSession };
    expect(describe_(r)).toBe("signed_in:user@example.com");
  });

  it("mfa_required → challenge 표시", () => {
    const r: AuthResult = {
      success: false,
      reason: "mfa_required",
      challenge: {
        challengeId: "ch_1",
        method: "totp",
        expiresAt: "2026-05-20T10:00:00.000Z",
      },
    };
    expect(describe_(r)).toBe("mfa:totp");
  });

  it("invalid_credentials → invalid", () => {
    const r: AuthResult = { success: false, reason: "invalid_credentials" };
    expect(describe_(r)).toBe("invalid");
  });

  it("rate_limited / account_locked / unverified_email 모두 처리", () => {
    expect(describe_({ success: false, reason: "rate_limited" })).toBe("rate_limited");
    expect(describe_({ success: false, reason: "account_locked" })).toBe("locked");
    expect(describe_({ success: false, reason: "unverified_email" })).toBe("unverified");
  });
});
