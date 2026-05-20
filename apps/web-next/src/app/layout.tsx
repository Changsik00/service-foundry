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
      <body className="min-h-screen bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
