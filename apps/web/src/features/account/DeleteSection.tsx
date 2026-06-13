"use client";

import { Button } from "@repo/frontend-ui";
import { useState } from "react";

import { useDeleteAccount } from "./mutations";

export function DeleteSection() {
  const [confirming, setConfirming] = useState(false);
  const { mutate, isPending, isError, error } = useDeleteAccount();

  return (
    <section className="space-y-3 rounded-md border border-destructive/30 p-4">
      <div>
        <h3 className="text-sm font-medium text-destructive">계정 삭제</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          계정을 삭제하면 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
        </p>
      </div>
      {isError && (
        <p role="alert" className="text-sm text-destructive">
          {error?.message ?? "계정 삭제에 실패했습니다. 다시 시도해주세요."}
        </p>
      )}
      {confirming ? (
        <div className="flex gap-2">
          <Button variant="destructive" size="sm" disabled={isPending} onClick={() => mutate()}>
            {isPending ? "삭제 중…" : "확인 — 영구 삭제"}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={isPending}
            onClick={() => setConfirming(false)}
          >
            취소
          </Button>
        </div>
      ) : (
        <Button variant="destructive" size="sm" onClick={() => setConfirming(true)}>
          계정 삭제
        </Button>
      )}
    </section>
  );
}
