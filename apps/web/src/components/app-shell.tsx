import { Sidebar } from "./sidebar";

/** 콘솔 골격 — 사이드바 + 콘텐츠 (max-w 1200 / 패딩 32, DESIGN §5.8) */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="min-w-0 flex-1 bg-background">
        <div className="mx-auto max-w-[1200px] p-8">{children}</div>
      </main>
    </div>
  );
}
