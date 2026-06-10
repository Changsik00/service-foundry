import type { AuthResult, SignInInput, SignUpInput, User } from "@repo/auth-contracts";
import { createContext } from "react";

export interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  signIn(input: SignInInput): Promise<AuthResult>;
  signOut(): Promise<void>;
  signUp(input: SignUpInput): Promise<AuthResult>;
  refresh(): Promise<void>;
  withAuthRetry<T>(fn: () => Promise<T>): Promise<T>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
