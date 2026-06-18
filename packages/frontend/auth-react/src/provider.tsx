import type { AuthResult, CoreAuthSDK, SignInInput, SignUpInput, User } from "@repo/auth-contracts";
import { type ReactNode, useCallback, useEffect, useState } from "react";

import { AuthContext } from "./context";

interface AuthProviderProps {
  sdk: CoreAuthSDK;
  children: ReactNode;
}

/** 액세스 토큰 만료 이 시간(ms) 전에 선제 갱신 — 사용자가 401 을 만나지 않도록. */
const PROACTIVE_REFRESH_MARGIN_MS = 60_000;

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
      .catch(() => {
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

  // 선제 갱신: 액세스 토큰 만료 margin 전에 자동 refresh → 사용자가 401 을 만나지 않음.
  // SDK 가 getAccessTokenExpiresAt 를 제공하지 않으면(provider 모드: 자체 갱신) 비활성.
  useEffect(() => {
    if (!user || !sdk.getAccessTokenExpiresAt) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;
    const schedule = (): void => {
      const exp = sdk.getAccessTokenExpiresAt?.();
      if (exp == null) return;
      const delay = Math.max(0, exp - Date.now() - PROACTIVE_REFRESH_MARGIN_MS);
      timer = setTimeout(async () => {
        if (cancelled) return;
        try {
          await sdk.refresh();
        } catch {
          return; // 실패는 reactive 401 경로가 처리 — 타이머는 조용히 종료
        }
        if (!cancelled) schedule(); // 새 만료로 재스케줄
      }, delay);
    };
    schedule();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [user, sdk]);

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut, signUp, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}
