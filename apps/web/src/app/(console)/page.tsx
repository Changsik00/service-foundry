import { AppError } from "@repo/errors";
import { createHttpClient } from "@repo/frontend-http-client";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/frontend-ui";
import { z } from "zod";
import { getEnv } from "@/env";
import { AccountCard } from "@/features/account";

// `/health` 는 매 요청마다 fetch — build 시점 static 추출 회피 (env 의존 + 외부 호출)
export const dynamic = "force-dynamic";

const HealthSchema = z.object({
  status: z.string(),
  uptime: z.number(),
  version: z.string(),
});

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
}

function StatusRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium tnum">{value}</span>
    </div>
  );
}

/**
 * 대시보드 — RSC. API 상태는 서버에서 fetch(zero-bundle), 계정 카드는 client query.
 * RSC + client hybrid 패턴 유지 (구 헬스카드 데모의 계승).
 */
export default async function DashboardPage(): Promise<React.ReactElement> {
  const client = createHttpClient({ baseUrl: getEnv().API_BASE_URL });

  let health: z.infer<typeof HealthSchema> | undefined;
  let healthError: string | undefined;
  try {
    health = await client.get("/health", { schema: HealthSchema });
  } catch (err) {
    healthError = err instanceof AppError ? `[${err.code}] ${err.message}` : String(err);
  }

  return (
    <>
      <h1 className="mb-6 text-xl font-semibold tracking-[-0.4px]">대시보드</h1>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AccountCard />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">API 상태</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            {health ? (
              <>
                <StatusRow
                  label="상태"
                  value={
                    <span className="inline-flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-success" aria-hidden />
                      {health.status}
                    </span>
                  }
                />
                <StatusRow label="가동 시간" value={formatUptime(health.uptime)} />
                <StatusRow label="버전" value={health.version} />
              </>
            ) : (
              <p className="py-2 text-sm text-error-text" role="alert">
                API 에 연결하지 못했습니다 — {healthError}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
