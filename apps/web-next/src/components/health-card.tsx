import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/frontend-ui";

export interface HealthData {
  status: string;
  uptime: number;
  version: string;
}

export interface HealthCardProps {
  data?: HealthData;
  error?: string;
}

/**
 * `HealthCard` — `apps/api` 의 `/health` 응답을 *presentation only* 로 표시.
 *
 * 본 컴포넌트는 *순수 view* — server / client 어느 쪽에서도 render 가능 (`'use client'` 미박힘).
 * 호출자 (RSC `page.tsx`) 가 *fetch + zod parse* 책임.
 */
export function HealthCard({ data, error }: HealthCardProps): React.ReactNode {
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
    return (
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Health</CardTitle>
          <CardDescription>응답 대기 중</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>API Health</CardTitle>
        <CardDescription>apps/api 의 `/health` 응답 (RSC 안에서 호출)</CardDescription>
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
