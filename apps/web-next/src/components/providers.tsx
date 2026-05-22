"use client";

import { AuthProvider } from "@repo/frontend-auth-react";
import { ThemeProvider } from "@repo/frontend-ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { authSDK } from "@/lib/auth";

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
    <ThemeProvider defaultTheme="system" disableTransitionOnChange>
      <AuthProvider sdk={authSDK}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
