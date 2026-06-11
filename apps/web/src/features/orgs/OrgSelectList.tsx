"use client";

import { cn } from "@repo/frontend-ui";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { accountQueries } from "@/features/account";
import { useSwitchOrg } from "./mutations";
import { orgQueries } from "./queries";

/** 조직 선택 리스트 (DESIGN §6.3) — 행 48px, 클릭 = 전환 → 콘솔 */
export function OrgSelectList() {
  const { data, isPending } = useQuery(orgQueries.list());
  const { data: me } = useQuery(accountQueries.me());
  const switchOrg = useSwitchOrg();
  const router = useRouter();

  if (isPending) return <div className="h-24 animate-pulse rounded-md bg-accent" />;

  const orgs = data?.orgs ?? [];
  if (orgs.length === 0) {
    return <p className="text-sm text-muted-foreground">소속된 조직이 없습니다</p>;
  }

  async function select(orgId: string) {
    if (orgId !== me?.user.orgId) await switchOrg.mutateAsync(orgId);
    router.push("/");
  }

  return (
    <ul className="flex flex-col gap-1">
      {orgs.map((org) => (
        <li key={org.orgId}>
          <button
            type="button"
            onClick={() => select(org.orgId)}
            disabled={switchOrg.isPending}
            className={cn(
              "flex h-12 w-full items-center gap-3 rounded-md px-2 text-left transition-colors duration-100 hover:bg-accent focus-visible:outline-none disabled:opacity-50",
              org.orgId === me?.user.orgId && "bg-surface-selected",
            )}
          >
            <span
              aria-hidden
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-tenant text-xs font-semibold text-primary-foreground"
            >
              {org.name.slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{org.name}</span>
            <span className="text-xs text-muted-foreground">{org.role}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
