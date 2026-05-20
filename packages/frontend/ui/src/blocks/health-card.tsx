"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/card.js";

export interface HealthData {
  status: string;
  uptime: number;
  version: string;
}

export interface HealthCardProps {
  data?: HealthData;
  error?: string;
  /** client query 환경에서 박음 (TanStack Query 의 isLoading 등). RSC 환경에선 미박힘 */
  loading?: boolean;
}

/**
 * `HealthCard` — `apps/api` 의 `/health` 응답을 *presentation only* 로 표시.
 *
 * 본 컴포넌트는 *server / client 어느 쪽도 render 가능* (`'use client'` 박혀있지만 Next 가 *client island* 로 처리, RSC 안에서 직접 사용 시에도 OK).
 * 호출자가 *fetch + parse + state* 책임 — 본 컴포넌트는 *순수 view*.
 *
 * 분기:
 * - `loading=true` → Loading Card (client query 시점)
 * - `error` → Destructive Card + error message
 * - `data` → Stats Card (status / uptime / version)
 * - 그 외 → null
 */
export function HealthCard({ data, error, loading }: HealthCardProps): React.ReactNode {
  if (loading) {
    return (
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
          <CardDescription>apps/api `/health` 로딩 중</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="max-w-md border-destructive">
        <CardHeader>
          <CardTitle>Health 호출 실패</CardTitle>
          <CardDescription>apps/api `/health` 응답 받지 못함</CardDescription>
        </CardHeader>
        <CardContent className="text-destructive text-sm">{error}</CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>API Health</CardTitle>
        <CardDescription>apps/api `/health` 응답</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted-foreground">status</dt>
          <dd className="font-medium">{data.status}</dd>
          <dt className="text-muted-foreground">uptime</dt>
          <dd className="font-mono">{data.uptime.toFixed(2)}s</dd>
          <dt className="text-muted-foreground">version</dt>
          <dd className="font-mono">{data.version}</dd>
        </dl>
      </CardContent>
    </Card>
  );
}
