"use client";

import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@repo/frontend-ui";
import { useQuery } from "@tanstack/react-query";

import {
  type SessionItem,
  sessionQueries,
  useRevokeOtherSessions,
  useRevokeSession,
} from "./queries";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SessionRow({ session }: { session: SessionItem }) {
  const { mutate: revoke, isPending } = useRevokeSession();
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-center gap-2">
          {session.current && (
            <Badge variant="brand" className="shrink-0 text-xs">
              현재 세션
            </Badge>
          )}
          <span className="truncate text-sm text-muted-foreground">
            {session.orgId ? `조직: ${session.orgId}` : "조직 없음"}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">만료: {formatDate(session.expiresAt)}</p>
      </div>
      {!session.current && (
        <Button
          variant="ghost"
          size="sm"
          disabled={isPending}
          onClick={() => revoke(session.id)}
          className="shrink-0 text-destructive hover:text-destructive"
        >
          종료
        </Button>
      )}
    </div>
  );
}

/** 활성 세션 목록 카드 — 개별·일괄 종료 지원 */
export function SessionsCard() {
  const { data, isPending, isError } = useQuery(sessionQueries.list());
  const { mutate: revokeOthers, isPending: isRevoking } = useRevokeOtherSessions();

  const sessions = data?.sessions ?? [];
  const hasOtherSessions = sessions.some((s) => !s.current);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-base">활성 세션</CardTitle>
        {hasOtherSessions && (
          <Button
            variant="secondary"
            size="sm"
            disabled={isRevoking}
            onClick={() => revokeOthers()}
          >
            다른 세션 모두 종료
          </Button>
        )}
      </CardHeader>
      <CardContent className="divide-y divide-border">
        {isPending ? (
          <div className="py-2">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 py-3">
                <div className="h-4 flex-1 animate-pulse rounded-sm bg-accent" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <p className="py-2 text-sm text-error-text" role="alert">
            세션 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요
          </p>
        ) : sessions.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">활성 세션이 없습니다</p>
        ) : (
          sessions.map((session) => <SessionRow key={session.id} session={session} />)
        )}
      </CardContent>
    </Card>
  );
}
