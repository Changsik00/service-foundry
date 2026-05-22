import type { Metadata } from "next";

import { Providers } from "@/components/providers.js";

import "./globals.css";

export const metadata: Metadata = {
  title: "service-foundry — web-next",
  description: "Next.js 16 App Router scaffold",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* 서버 컴포넌트에서 렌더링 — React 19 script 경고 없음. FOUC 방지용. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme')||'system';if(t==='system'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.classList.add(t)}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
