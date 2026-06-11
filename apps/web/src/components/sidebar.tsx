"use client";

import { cn } from "@repo/frontend-ui";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { UserMenu } from "./user-menu";

// 메뉴는 실화면이 있는 것만 — 자리 차지용 디밍 메뉴 금지 (DESIGN 가드레일 #3 정신)
const NAV = [{ href: "/", label: "대시보드" }] as const;

/** 콘솔 사이드바 — 240px #f6f5f4, active 는 무채색 (blue 금지, DESIGN §5.8) */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col bg-secondary">
      <div className="px-5 py-5">
        <Link href="/" className="text-sm font-semibold text-foreground">
          service-foundry
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 px-3">
        {NAV.map(({ href, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex h-8 items-center rounded-sm px-2 text-sm transition-colors duration-100",
                active
                  ? "bg-surface-selected font-medium text-foreground"
                  : "text-secondary-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {label}
            </Link>
          );
        })}
      </nav>
      <UserMenu />
    </aside>
  );
}
