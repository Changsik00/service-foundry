import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "service-foundry — web-next",
  description: "Next.js 16 App Router scaffold (phase-04 spec-04-03)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-background text-foreground">{children}</body>
    </html>
  );
}
