"use client";

import { useSession } from "@repo/frontend-auth-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** 어드민 전용 레이아웃 — users.role="admin" 인 유저만 접근 허용, 아니면 / 리다이렉트 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.replace("/");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== "admin") return null;
  return <>{children}</>;
}
