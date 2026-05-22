"use client";

import { useEffect, useState } from "react";

import { Button } from "../components/button";
import { useTheme } from "../lib/theme-context";

/**
 * `ThemeToggle` — sun/moon emoji button. light ↔ dark 토글.
 *
 * `next-themes` 의 `useTheme()` 사용 — SSR-safe (mounted 이전 placeholder).
 * 호출자: app root 안 `<ThemeProvider>` (next-themes) 박은 후 사용.
 */
export function ThemeToggle(): React.ReactElement {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  // hydration mismatch 회피 — mount 전 placeholder
  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" aria-label="Toggle theme" disabled>
        <span className="text-lg">⋯</span>
      </Button>
    );
  }

  const isDark = theme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <span className="text-lg" aria-hidden="true">
        {isDark ? "☀️" : "🌙"}
      </span>
    </Button>
  );
}
