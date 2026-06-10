import type { AuthResult, CoreAuthSDK, SignInInput, SignUpInput, User } from "@repo/auth-contracts";
import { type ReactNode, useCallback, useEffect, useState } from "react";

import { AuthContext } from "./context";

const is401 = (e: unknown): boolean =>
  !!e && typeof e === "object" && (e as { statusCode?: number }).statusCode === 401;

interface AuthProviderProps {
  sdk: CoreAuthSDK;
  children: ReactNode;
}

export function AuthProvider({ sdk, children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    sdk
      .getCurrentUser()
      .then((u) => {
        setUser(u);
        setIsLoading(false);
      })
      .catch(async (e) => {
        if (is401(e)) {
          try {
            await sdk.refresh();
            const u = await sdk.getCurrentUser();
            setUser(u);
          } catch {
            setUser(null);
          }
        }
        setIsLoading(false);
      });
  }, [sdk]);

  const signIn = useCallback(
    async (input: SignInInput): Promise<AuthResult> => {
      const result = await sdk.signIn(input);
      if (result.success) setUser(result.user);
      return result;
    },
    [sdk],
  );

  const signOut = useCallback(async (): Promise<void> => {
    await sdk.signOut();
    setUser(null);
  }, [sdk]);

  const signUp = useCallback(
    async (input: SignUpInput): Promise<AuthResult> => {
      const result = await sdk.signUp(input);
      if (result.success) setUser(result.user);
      return result;
    },
    [sdk],
  );

  const refresh = useCallback(async (): Promise<void> => {
    await sdk.refresh();
  }, [sdk]);

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut, signUp, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}
