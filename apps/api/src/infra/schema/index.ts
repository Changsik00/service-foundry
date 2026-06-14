import { type AuditLogRow, authAuditLogs } from "@repo/backend-auth-audit";
import { failedLogins, lockouts } from "@repo/backend-auth-rate-limit/schema";
import { type SessionInsert, type SessionRow, sessions } from "@repo/backend-auth-session";
import { type ApiKeyInsert, type ApiKeyRow, apiKeys } from "./api-keys.js";
import {
  type EmailChangeTokenInsert,
  type EmailChangeTokenRow,
  emailChangeTokens,
} from "./email-change-tokens.js";
import {
  type EmailVerifyTokenInsert,
  type EmailVerifyTokenRow,
  emailVerifyTokens,
} from "./email-verify-tokens.js";
import { type FeatureFlagInsert, type FeatureFlagRow, featureFlags } from "./feature-flags.js";
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
  ApiKeyInsert,
  ApiKeyRow,
  AuditLogRow,
  EmailChangeTokenInsert,
  EmailChangeTokenRow,
  EmailVerifyTokenInsert,
  EmailVerifyTokenRow,
  FeatureFlagInsert,
  FeatureFlagRow,
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
  apiKeys,
  authAuditLogs,
  emailChangeTokens,
  emailVerifyTokens,
  failedLogins,
  featureFlags,
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
  apiKeys,
  featureFlags,
  users,
  organizations,
  memberships,
  invitations,
  passwordResetTokens,
  emailVerifyTokens,
  emailChangeTokens,
  sessions,
  authAuditLogs,
  oauthAccounts,
  mfaConfigs,
  passkeyCredentials,
  passkeyChallenges,
  failedLogins,
  lockouts,
};
