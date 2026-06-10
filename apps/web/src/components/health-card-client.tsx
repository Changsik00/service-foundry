"use client";

import { HealthCard } from "@repo/frontend-ui";

import { useHealthQuery } from "@/lib/queries";

/**
 * `HealthCardClient` — *client component*.
 *
 * RSC `page.tsx` 가 *server fetch* 박지만, 본 컴포넌트는 *client 에서 별도 query* — *refetch / cache / interaction* 가능.
 * **RSC + client hybrid 시연** — Next App Router 의 진짜 가치.
 */
export function HealthCardClient(): React.ReactElement {
  const { data, error, isLoading } = useHealthQuery();

  return (
    <HealthCard
      {...(data !== undefined && { data })}
      {...(error !== null && error !== undefined && { error: error.message })}
      loading={isLoading}
    />
  );
}
