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

// === Auth flow schemas (spec-05-01) — stub === //
// Green 단계에서 실 schema (length 검증 등) 박음.
export const SignInInput = z.object({ email: Email, password: z.string() });
export const SignUpInput = z.object({ email: Email, password: z.string() });
export const RefreshInput = z.object({ refreshToken: z.string() });
export const PasswordResetRequest = z.object({ email: Email });
export const PasswordResetConfirm = z.object({ token: z.string(), newPassword: z.string() });
export const EmailVerifyRequest = z.object({ email: Email });
export const EmailVerifyConfirm = z.object({ token: z.string() });

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
