"use client";

import { Button, Input, Label } from "@repo/frontend-ui";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { useUpdateProfile } from "./mutations";
import { accountQueries } from "./queries";

export function ProfileForm() {
  const { data } = useQuery(accountQueries.me());
  const [displayName, setDisplayName] = useState(data?.user.displayName ?? "");
  const { mutate, isPending, isError, error } = useUpdateProfile();

  // keep input in sync with fetched data on first load
  const currentName = data?.user.displayName ?? "";
  if (displayName === "" && currentName !== "") {
    setDisplayName(currentName);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutate({ displayName });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="displayName">이름</Label>
        <Input
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </div>
      {isError && (
        <p role="alert" className="text-sm text-destructive">
          {error?.message ?? "저장에 실패했습니다. 다시 시도해주세요."}
        </p>
      )}
      <Button type="submit" disabled={isPending}>
        {isPending ? "저장 중…" : "저장"}
      </Button>
    </form>
  );
}
