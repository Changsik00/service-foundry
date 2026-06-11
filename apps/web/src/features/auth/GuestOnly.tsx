"use client";

import { useSession } from "@repo/frontend-auth-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** (auth) 가드 — 로그인 상태면 콘솔(/)로 보낸다 (ARCHITECTURE §5) */
export function GuestOnly({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) router.replace("/");
  }, [user, isLoading, router]);

  if (!isLoading && user) return null;
  return <>{children}</>;
}
