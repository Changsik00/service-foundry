import {
  type PasswordResetTokenInsert,
  type PasswordResetTokenRow,
  passwordResetTokens,
} from "./password-reset-tokens.js";
import { type UserInsert, type UserRow, users } from "./users.js";

export type { PasswordResetTokenInsert, PasswordResetTokenRow, UserInsert, UserRow };
export { passwordResetTokens, users };

export const appSchema = { users, passwordResetTokens };
