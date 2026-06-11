/** auth·선택류 화면 공통 골격 — #f6f5f4 캔버스 + 400px 카드 (DESIGN §6.0). 2회 사용으로 승격 */
export function CardCanvas({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-secondary p-8">
      <p className="mb-6 text-sm font-semibold text-secondary-foreground">service-foundry</p>
      <div className="w-full max-w-[400px] rounded-lg bg-card p-8 shadow-md">{children}</div>
    </main>
  );
}
