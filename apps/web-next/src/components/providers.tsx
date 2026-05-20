"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

/**
 * `Providers` — client component wrapper. layout.tsx 안에서 wrap.
 *
 * Next App Router 표준 — server 의 `layout.tsx` 가 *client provider* 를 *boundary* 로 박음.
 * `useState` 로 QueryClient 인스턴스화 — 매 render 마다 새 인스턴스 회피.
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

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
