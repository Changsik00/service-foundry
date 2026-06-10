import type { Metadata } from "next";
import { cookies } from "next/headers";

import { Providers } from "@/components/providers";

import "./globals.css";

export const metadata: Metadata = {
  title: "service-foundry — web",
  description: "Next.js 16 App Router scaffold",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const cookieTheme = cookieStore.get("theme")?.value;
  const themeClass = cookieTheme === "dark" || cookieTheme === "light" ? cookieTheme : undefined;

  return (
    <html lang="ko" className={themeClass} suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
