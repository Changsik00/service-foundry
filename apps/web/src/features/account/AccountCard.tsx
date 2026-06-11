"use client";

import { useSession } from "@repo/frontend-auth-react";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/frontend-ui";
import { useQuery } from "@tanstack/react-query";

import { accountQueries } from "./queries";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
      <span
        className="truncate text-sm font-medium"
        title={typeof value === "string" ? value : undefined}
      >
        {value}
      </span>
    </div>
  );
}

/** 내 계정 카드 — 실데이터만 (세션 이메일 + GET /auth/me 클레임). 로딩은 Skeleton 행 */
export function AccountCard() {
  const { user } = useSession();
  const { data, isPending, isError } = useQuery(accountQueries.me());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">내 계정</CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-border">
        <Row label="이메일" value={user?.email ?? "—"} />
        {isPending ? (
          <>
            <Row
              label="사용자 ID"
              value={<span className="inline-block h-4 w-40 animate-pulse rounded-sm bg-accent" />}
            />
            <Row
              label="역할"
              value={<span className="inline-block h-4 w-16 animate-pulse rounded-sm bg-accent" />}
            />
            <Row
              label="조직"
              value={<span className="inline-block h-4 w-40 animate-pulse rounded-sm bg-accent" />}
            />
          </>
        ) : isError ? (
          <p className="py-2 text-sm text-error-text" role="alert">
            계정 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요
          </p>
        ) : (
          <>
            <Row label="사용자 ID" value={data.user.sub} />
            <Row label="역할" value={data.user.role} />
            <Row label="조직" value={data.user.orgId ?? "—"} />
          </>
        )}
      </CardContent>
    </Card>
  );
}
