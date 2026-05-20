"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState } from "react";

/**
 * `Providers` — client component wrapper. layout.tsx 안에서 wrap.
 *
 * 박힌 provider:
 * - `<ThemeProvider>` (next-themes) — dark/light theme + system 감지 + localStorage 동기
 * - `<QueryClientProvider>` (TanStack Query) — useState 로 인스턴스화 (매 render 마다 회피)
 *
 * 순서: ThemeProvider (outer) → QueryClient (inner). theme 가 query 와 무관 — 어느 순서도 가능.
 */
export function Providers({ children }: { children: React.ReactNode }): React.ReactElement {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ThemeProvider>
  );
}
