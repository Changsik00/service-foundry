import type { Metadata } from "next";
import Script from "next/script";

import { Providers } from "@/components/providers.js";

import "./globals.css";

export const metadata: Metadata = {
  title: "service-foundry — web-next",
  description: "Next.js 16 App Router scaffold",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground">
        <Script id="theme-init" strategy="beforeInteractive">
          {`try{var t=localStorage.getItem('theme')||'system';if(t==='system'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.classList.add(t)}catch(e){}`}
        </Script>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
