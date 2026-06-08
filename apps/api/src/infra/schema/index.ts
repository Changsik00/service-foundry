import { type AuditLogRow, authAuditLogs } from "@repo/backend-auth-audit";
import { failedLogins, lockouts } from "@repo/backend-auth-rate-limit/schema";
import { type SessionInsert, type SessionRow, sessions } from "@repo/backend-auth-session";
import {
  type EmailVerifyTokenInsert,
  type EmailVerifyTokenRow,
  emailVerifyTokens,
} from "./email-verify-tokens.js";
import {
  type InvitationInsert,
  type InvitationRow,
  invitations,
  inviteRoleEnum,
} from "./invitations.js";
import {
  type MembershipInsert,
  type MembershipRow,
  memberships,
  orgRoleEnum,
} from "./memberships.js";
import { type MfaConfigInsert, type MfaConfigRow, mfaConfigs } from "./mfa-configs.js";
import { type OAuthAccountInsert, type OAuthAccountRow, oauthAccounts } from "./oauth-accounts.js";
import { type OrganizationInsert, type OrganizationRow, organizations } from "./organizations.js";
import {
  type PasskeyChallengeInsert,
  type PasskeyChallengeRow,
  passkeyChallenges,
} from "./passkey-challenges.js";
import {
  type PasskeyCredentialInsert,
  type PasskeyCredentialRow,
  passkeyCredentials,
} from "./passkey-credentials.js";
import {
  type PasswordResetTokenInsert,
  type PasswordResetTokenRow,
  passwordResetTokens,
} from "./password-reset-tokens.js";
import { type UserInsert, type UserRow, users } from "./users.js";

export type {
  AuditLogRow,
  EmailVerifyTokenInsert,
  EmailVerifyTokenRow,
  InvitationInsert,
  InvitationRow,
  MembershipInsert,
  MembershipRow,
  MfaConfigInsert,
  MfaConfigRow,
  OAuthAccountInsert,
  OAuthAccountRow,
  OrganizationInsert,
  OrganizationRow,
  PasskeyChallengeInsert,
  PasskeyChallengeRow,
  PasskeyCredentialInsert,
  PasskeyCredentialRow,
  PasswordResetTokenInsert,
  PasswordResetTokenRow,
  SessionInsert,
  SessionRow,
  UserInsert,
  UserRow,
};
export {
  authAuditLogs,
  emailVerifyTokens,
  failedLogins,
  invitations,
  inviteRoleEnum,
  lockouts,
  memberships,
  mfaConfigs,
  oauthAccounts,
  organizations,
  orgRoleEnum,
  passkeyChallenges,
  passkeyCredentials,
  passwordResetTokens,
  sessions,
  users,
};

export const appSchema = {
  users,
  organizations,
  memberships,
  invitations,
  passwordResetTokens,
  emailVerifyTokens,
  sessions,
  authAuditLogs,
  oauthAccounts,
  mfaConfigs,
  passkeyCredentials,
  passkeyChallenges,
  failedLogins,
  lockouts,
};
