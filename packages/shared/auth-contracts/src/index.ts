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

  // MFA
  verifyMfaTotp(mfaChallengeToken: string, code: string): Promise<AuthResult>;

  // Passkey
  fetchPasskeyRegisterOptions(): Promise<{ challengeToken: string; options: object }>;
  verifyPasskeyRegister(challengeToken: string, credential: unknown): Promise<void>;
  fetchPasskeyAuthOptions(): Promise<{ challengeToken: string; options: object }>;
  verifyPasskeyAuth(
    challengeToken: string,
    credentialId: string,
    credential: unknown,
  ): Promise<AuthResult>;
}

/** Provider 패키지가 최소한 구현해야 하는 Core Surface (5개 메서드). */
export type CoreAuthSDK = Pick<
  AuthSDK,
  "signIn" | "signOut" | "getCurrentUser" | "signUp" | "refresh"
>;

// === Auth HTTP Integration (spec-x-auth-http-integration) === //

/** SDK 초기화 상태를 포함한 3-state 인증 상태 */
export type AuthStatus = "unknown" | "authenticated" | "unauthenticated";

/**
 * http-client가 의존하는 최소 인증 소스 계약.
 * AuthStore(Zustand)가 구현하며, 각 SDK 어댑터가 store를 채움.
 */
export interface AuthSource {
  readonly status: AuthStatus;
  /** null = 미인증 또는 초기화 전 */
  getToken(): Promise<string | null>;
  /** 토큰 갱신 — 401 수신 시 http-client가 호출 */
  refresh(): Promise<void>;
  /** unknown 상태가 풀릴 때까지 대기 (기본 5000ms — timeout 시 resolve) */
  waitUntilSettled(timeoutMs?: number): Promise<void>;
}

// === Multi-tenancy contracts (spec-17-02) === //
export const OrgRole = z.enum(["owner", "admin", "member"]);
export type OrgRole = z.output<typeof OrgRole>;

export const InviteRole = z.enum(["admin", "member"]);
export type InviteRole = z.output<typeof InviteRole>;

export const Organization = z.object({
  id: Uuid,
  name: z.string(),
  slug: z.string(),
  isPersonal: z.boolean(),
  ownerId: Uuid,
  createdAt: z.iso.datetime(),
});
export type Organization = z.output<typeof Organization>;

export const Membership = z.object({
  id: Uuid,
  userId: Uuid,
  orgId: Uuid,
  role: OrgRole,
  createdAt: z.iso.datetime(),
});
export type Membership = z.output<typeof Membership>;

export const InvitationRow = z.object({
  id: Uuid,
  orgId: Uuid,
  email: Email,
  role: InviteRole,
  invitedBy: Uuid,
  expiresAt: z.iso.datetime(),
  acceptedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
});
export type InvitationRow = z.output<typeof InvitationRow>;

export const OrgSwitchInput = z.object({ orgId: Uuid });
export type OrgSwitchInput = z.output<typeof OrgSwitchInput>;

export const OrgInviteInput = z.object({ email: Email, role: InviteRole });
export type OrgInviteInput = z.output<typeof OrgInviteInput>;

export const OrgInviteAcceptInput = z.object({ token: Token });
export type OrgInviteAcceptInput = z.output<typeof OrgInviteAcceptInput>;
