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
  UserInsert,
  UserRow,
};
export { emailVerifyTokens, passwordResetTokens, users };

export const appSchema = { users, passwordResetTokens, emailVerifyTokens };
