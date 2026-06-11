"use client";

import { useSession } from "@repo/frontend-auth-react";
import { Button } from "@repo/frontend-ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAcceptInvite } from "./mutations";

function errorMessage(status: number | undefined): string {
  // 사실 + 다음 행동 (DESIGN §9). 조직명 미표기 — 초대 preview API 부재 (fill-forward 후속)
  if (status === 410 || status === 404)
    return "초대가 만료되었거나 유효하지 않습니다. 초대한 분께 다시 요청해주세요";
  if (status === 409) return "이미 이 조직의 멤버입니다";
  if (status === 403) return "초대 대상 이메일과 로그인 계정이 다릅니다";
  return "요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요";
}

/** 초대 수락 (DESIGN §6.4) — 로그인 분기 + 수락 → 해당 org 콘솔 직행 (accept 가 전환까지 수행) */
export function InviteAccept({ token }: { token: string }) {
  const { user, isLoading } = useSession();
  const accept = useAcceptInvite();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  if (isLoading) return <div className="h-24 animate-pulse rounded-md bg-accent" />;

  if (!user) {
    const redirect = encodeURIComponent(`/invite/${token}`);
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm leading-relaxed text-secondary-foreground">
          조직 초대를 받았습니다. 수락하려면 계정이 필요합니다
        </p>
        <Button size="lg" className="w-full" asChild>
          <Link href={`/signup?redirect=${redirect}`}>계정 만들고 수락</Link>
        </Button>
        <Button size="lg" variant="secondary" className="w-full" asChild>
          <Link href={`/login?redirect=${redirect}`}>로그인하고 수락</Link>
        </Button>
      </div>
    );
  }

  async function handleAccept() {
    setError(null);
    try {
      await accept.mutateAsync(token);
      router.push("/");
    } catch (err) {
      const status =
        (err as { statusCode?: number }).statusCode ?? (err as { status?: number }).status;
      setError(errorMessage(status));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm leading-relaxed text-secondary-foreground">
        {user.email} 계정으로 조직 초대를 수락합니다
      </p>
      {error && (
        <p role="alert" className="text-xs text-error-text">
          {error}
        </p>
      )}
      <Button size="lg" className="w-full" onClick={handleAccept} disabled={accept.isPending}>
        {accept.isPending ? "수락 중…" : "초대 수락"}
      </Button>
    </div>
  );
}
