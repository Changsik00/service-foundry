import { GuestOnly } from "@/features/auth";

// (auth) 공통 골격 — DESIGN §6.0. 가드 + 골격을 이 1곳에만 (ARCHITECTURE §5)
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <GuestOnly>
      <main className="flex min-h-screen flex-col items-center justify-center bg-secondary p-8">
        <p className="mb-6 text-sm font-semibold text-secondary-foreground">service-foundry</p>
        <div className="w-full max-w-[400px] rounded-lg bg-card p-8 shadow-md">{children}</div>
      </main>
    </GuestOnly>
  );
}
