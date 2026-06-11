"use client";

import {
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/frontend-ui";
import { useQuery } from "@tanstack/react-query";

import { accountQueries } from "@/features/account";
import { useSwitchOrg } from "./mutations";
import { orgQueries } from "./queries";

function OrgAvatar({ name }: { name: string }) {
  return (
    <span
      aria-hidden
      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-tenant text-xs font-semibold text-primary-foreground"
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

/** 사이드바 상단 테넌트 스위처 (DESIGN §5.8) — 전환 = switch API + 전체 invalidate (ADR-0026) */
export function TenantSwitcher() {
  const { data: orgsData } = useQuery(orgQueries.list());
  const { data: me } = useQuery(accountQueries.me());
  const switchOrg = useSwitchOrg();

  const orgs = orgsData?.orgs ?? [];
  const active = orgs.find((o) => o.orgId === me?.user.orgId) ?? orgs[0];
  if (!active) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="mx-3 flex items-center gap-2 rounded-md p-2 text-left transition-colors duration-100 hover:bg-accent focus-visible:outline-none"
        aria-label={`현재 조직: ${active.name}`}
      >
        <OrgAvatar name={active.name} />
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{active.name}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0 text-muted-foreground"
          role="presentation"
          aria-hidden="true"
        >
          <path d="m7 15 5 5 5-5" />
          <path d="m7 9 5-5 5 5" />
        </svg>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {orgs.map((org) => {
          const isActive = org.orgId === active.orgId;
          return (
            <DropdownMenuItem
              key={org.orgId}
              onSelect={() => {
                if (!isActive) switchOrg.mutate(org.orgId);
              }}
              className={cn("h-12", isActive && "border-l-2 border-primary bg-surface-selected")}
            >
              <OrgAvatar name={org.name} />
              <span className="min-w-0 flex-1 truncate">{org.name}</span>
              <span className="text-xs text-muted-foreground">{org.role}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
