"use client";

import { useSession } from "@repo/frontend-auth-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

/** (console) 가드 — 미로그인이면 /login?redirect=<path> (ARCHITECTURE §5). GuestOnly 의 대칭 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      const redirect =
        pathname && pathname !== "/" ? `?redirect=${encodeURIComponent(pathname)}` : "";
      router.replace(`/login${redirect}`);
    }
  }, [user, isLoading, router, pathname]);

  if (isLoading || !user) return null;
  return <>{children}</>;
}
