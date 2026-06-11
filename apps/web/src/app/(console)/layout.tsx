import { AppShell } from "@/components/app-shell";
import { AuthGuard } from "@/features/auth";

// (console) — 가드 + 셸을 이 1곳에만 (ARCHITECTURE §5)
export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
