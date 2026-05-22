"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  theme: string | undefined;
  setTheme: (theme: string) => void;
  resolvedTheme: string | undefined;
  themes: string[];
  systemTheme: "dark" | "light" | undefined;
  forcedTheme: string | undefined;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

function getStoredTheme(fallback: Theme): Theme {
  try {
    return (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? fallback;
  } catch {
    return fallback;
  }
}

export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  disableTransitionOnChange?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  disableTransitionOnChange = false,
}: ThemeProviderProps): React.ReactElement {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme | undefined>(undefined);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setThemeState(getStoredTheme(defaultTheme));
    setSystemTheme(getSystemTheme());
    setMounted(true);
  }, [defaultTheme]);

  useEffect(() => {
    const mq = window.matchMedia(DARK_QUERY);
    const handler = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? "dark" : "light");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const resolvedTheme = useMemo<ResolvedTheme | undefined>(() => {
    if (!mounted) return undefined;
    return theme === "system" ? (systemTheme ?? getSystemTheme()) : theme;
  }, [theme, systemTheme, mounted]);

  useEffect(() => {
    if (!resolvedTheme) return;
    if (disableTransitionOnChange) {
      const style = document.createElement("style");
      style.appendChild(document.createTextNode("*,*::before,*::after{transition:none!important}"));
      document.head.appendChild(style);
      window.getComputedStyle(document.body);
      setTimeout(() => document.head.removeChild(style), 1);
    }
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(resolvedTheme);
    // SSR FOUC 방지용 쿠키 — layout.tsx 서버 컴포넌트에서 읽어 초기 class 적용
    document.cookie = `theme=${resolvedTheme};path=/;max-age=31536000;samesite=strict`;
  }, [resolvedTheme, disableTransitionOnChange]);

  const setTheme = useCallback((newTheme: string) => {
    const t = newTheme as Theme;
    setThemeState(t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {}
  }, []);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      resolvedTheme,
      themes: ["light", "dark", "system"],
      systemTheme,
      forcedTheme: undefined,
    }),
    [theme, setTheme, resolvedTheme, systemTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  return (
    useContext(ThemeContext) ?? {
      theme: undefined,
      setTheme: () => {},
      resolvedTheme: undefined,
      themes: ["light", "dark", "system"],
      systemTheme: undefined,
      forcedTheme: undefined,
    }
  );
}
