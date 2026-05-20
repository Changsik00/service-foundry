import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/frontend-ui";

export interface HealthData {
  status: string;
  uptime: number;
  version: string;
}

export interface HealthCardProps {
  data?: HealthData;
  error?: string;
  loading?: boolean;
}

/**
 * `HealthCard` — `/health` 응답을 *presentation only* 로 표시.
 *
 * web-next 의 `health-card.tsx` 와 유사 + `loading` 분기 추가 (client query 자연).
 * *공통 패키지 추출* 은 별 spec — 본 spec 은 *복사 + loading 분기 추가*.
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
        <CardDescription>apps/api `/health` 응답 (client query)</CardDescription>
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
