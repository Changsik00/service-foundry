import { AppError } from "@repo/errors";
import { createHttpClient } from "@repo/frontend-http-client";
import { z } from "zod";

import { HealthCard } from "@/components/health-card.js";
import { getEnv } from "@/env.js";

// `/health` 는 매 요청마다 fetch — build 시점 static 추출 회피 (env 의존 + 외부 호출).
export const dynamic = "force-dynamic";

const HealthSchema = z.object({
  status: z.string(),
  uptime: z.number(),
  version: z.string(),
});

/**
 * Home page — **async server component (RSC)**.
 *
 * Next.js App Router 의 default 패턴 — `apps/api` 의 `/health` 를 *서버에서* 호출 + HTML 에 렌더.
 * client bundle 에 fetch 코드 포함 안 됨 (zero-bundle).
 *
 * Note: `force-dynamic` 박혀있어 매 요청마다 RSC 실행. cache/revalidate 패러다임 진입은 별 spec.
 */
export default async function Home(): Promise<React.ReactElement> {
  const client = createHttpClient({ baseUrl: getEnv().API_BASE_URL });

  let errorMessage: string | undefined;
  let data: z.infer<typeof HealthSchema> | undefined;

  try {
    data = await client.get("/health", { schema: HealthSchema });
  } catch (err) {
    errorMessage =
      err instanceof AppError
        ? `[${err.code}] ${err.message}`
        : err instanceof Error
          ? err.message
          : String(err);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="font-semibold text-2xl">service-foundry</h1>
      <p className="text-muted-foreground text-sm">
        Next.js 16 App Router scaffold (RSC + `@repo/frontend-http-client` + `@repo/frontend-ui`)
      </p>
      <HealthCard
        {...(data !== undefined && { data })}
        {...(errorMessage !== undefined && { error: errorMessage })}
      />
    </main>
  );
}
