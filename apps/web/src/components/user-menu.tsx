"use client";

import { useAuth, useSession } from "@repo/frontend-auth-react";
import { Button } from "@repo/frontend-ui";
import { useRouter } from "next/navigation";

/** 사이드바 하단 유저 영역 — 이메일 + 로그아웃 (DESIGN §5.8) */
export function UserMenu() {
  const { signOut } = useAuth();
  const { user } = useSession();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  if (!user) return null;

  return (
    <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-3">
      <span className="truncate text-xs text-secondary-foreground" title={user.email}>
        {user.email}
      </span>
      <Button variant="ghost" size="sm" onClick={handleSignOut} className="shrink-0">
        로그아웃
      </Button>
    </div>
  );
}
