import { type SessionInsert, type SessionRow, sessions } from "@repo/backend-auth-session";
import {
  type EmailVerifyTokenInsert,
  type EmailVerifyTokenRow,
  emailVerifyTokens,
} from "./email-verify-tokens.js";
import {
  type PasswordResetTokenInsert,
  type PasswordResetTokenRow,
  passwordResetTokens,
} from "./password-reset-tokens.js";
import { type UserInsert, type UserRow, users } from "./users.js";

export type {
  EmailVerifyTokenInsert,
  EmailVerifyTokenRow,
  PasswordResetTokenInsert,
  PasswordResetTokenRow,
  SessionInsert,
  SessionRow,
  UserInsert,
  UserRow,
};
export { emailVerifyTokens, passwordResetTokens, sessions, users };

export const appSchema = { users, passwordResetTokens, emailVerifyTokens, sessions };
