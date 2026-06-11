import { CardCanvas } from "@/components/card-canvas";
import { GuestOnly } from "@/features/auth";

// (auth) — 가드 + 골격을 이 1곳에만 (ARCHITECTURE §5)
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <GuestOnly>
      <CardCanvas>{children}</CardCanvas>
    </GuestOnly>
  );
}
