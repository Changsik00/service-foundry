import { Email, Uuid } from "@repo/validation";
import { z } from "zod";

export const Role = z.enum(["user", "admin"]);
export type Role = z.output<typeof Role>;

export const User = z.object({
  id: Uuid,
  email: Email,
  role: Role,
  createdAt: z.iso.datetime(),
});
export type User = z.output<typeof User>;

export const Session = z.object({
  userId: Uuid,
  expiresAt: z.iso.datetime(),
});
export type Session = z.output<typeof Session>;

export const JwtPayload = z.object({
  sub: Uuid,
  role: Role,
  iat: z.number().int(),
  exp: z.number().int(),
});
export type JwtPayload = z.output<typeof JwtPayload>;

// === Auth flow primitives (spec-05-01) === //
/** Password — 본 spec 은 *서버 최소 검증* 만 (강도 검증은 spec-05-04 auth-security). */
export const Password = z.string().min(8).max(128);
/** Token — URL-safe random 문자열 가정. 실 생성/검증은 spec-05-02 (auth-session). */
export const Token = z.string().min(20);

// === Auth flow schemas (spec-05-01) === //
export const SignInInput = z.object({ email: Email, password: Password });
export const SignUpInput = z.object({
  email: Email,
  password: Password,
  displayName: z.string().min(1).max(100).optional(),
});
export const RefreshInput = z.object({ refreshToken: Token });
export const PasswordResetRequest = z.object({ email: Email });
export const PasswordResetConfirm = z.object({ token: Token, newPassword: Password });
export const EmailVerifyRequest = z.object({ email: Email });
export const EmailVerifyConfirm = z.object({ token: Token });

export type SignInInput = z.output<typeof SignInInput>;
export type SignUpInput = z.output<typeof SignUpInput>;
export type RefreshInput = z.output<typeof RefreshInput>;
export type PasswordResetRequest = z.output<typeof PasswordResetRequest>;
export type PasswordResetConfirm = z.output<typeof PasswordResetConfirm>;
export type EmailVerifyRequest = z.output<typeof EmailVerifyRequest>;
export type EmailVerifyConfirm = z.output<typeof EmailVerifyConfirm>;

export interface MfaChallenge {
  challengeId: string;
  method: "totp" | "passkey";
  expiresAt: string;
}

export type AuthResult =
  | { success: true; user: User; session: Session }
  | { success: false; reason: "mfa_required"; challenge: MfaChallenge }
  | {
      success: false;
      reason: "invalid_credentials" | "rate_limited" | "account_locked" | "unverified_email";
    };

// === Auth SDK Core Surface (ADR-0006 Decision 2) === //

/**
 * AuthSDK — 모든 auth provider 패키지가 구현하는 최소 인터페이스.
 *
 * "Consistent Wrapped SDK" 컨벤션: auth-react Provider 와 consumer 코드는
 * 이 interface 만 의존 → SDK(구현체) 교체 시 코드 변경 없음.
 */
export interface AuthSDK {
  signIn(input: SignInInput): Promise<AuthResult>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  signUp(input: SignUpInput): Promise<AuthResult>;
  refresh(): Promise<Session | null>;
}
