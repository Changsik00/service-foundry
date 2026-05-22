import { type AuditLogRow, authAuditLogs } from "@repo/backend-auth-audit";
import { type SessionInsert, type SessionRow, sessions } from "@repo/backend-auth-session";
import {
  type EmailVerifyTokenInsert,
  type EmailVerifyTokenRow,
  emailVerifyTokens,
} from "./email-verify-tokens.js";
import { type MfaConfigInsert, type MfaConfigRow, mfaConfigs } from "./mfa-configs.js";
import { type OAuthAccountInsert, type OAuthAccountRow, oauthAccounts } from "./oauth-accounts.js";
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
  MfaConfigInsert,
  MfaConfigRow,
  OAuthAccountInsert,
  OAuthAccountRow,
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
  mfaConfigs,
  oauthAccounts,
  passwordResetTokens,
  sessions,
  users,
};

export const appSchema = {
  users,
  passwordResetTokens,
  emailVerifyTokens,
  sessions,
  authAuditLogs,
  oauthAccounts,
  mfaConfigs,
};
