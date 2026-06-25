"use client";

import { Button, Input, Label } from "@repo/frontend-ui";
import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";

import { useUpdateProfile, useUploadAvatar } from "./mutations";
import { accountQueries } from "./queries";

function AvatarSection() {
  const { data } = useQuery(accountQueries.me());
  const { mutate: uploadAvatar, isPending, isError, error } = useUploadAvatar();
  const inputRef = useRef<HTMLInputElement>(null);

  const avatarUrl = data?.user.avatarUrl ?? null;
  const initial = data?.user.displayName?.[0] ?? data?.user.email?.[0] ?? "?";

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadAvatar(file);
  }

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        className="size-16 overflow-hidden rounded-full ring-2 ring-border focus:outline-none focus:ring-primary"
        onClick={() => inputRef.current?.click()}
        title="아바타 변경"
        disabled={isPending}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="프로필 이미지" className="size-full object-cover" />
        ) : (
          <span className="flex size-full items-center justify-center bg-muted text-xl font-semibold uppercase text-muted-foreground">
            {initial}
          </span>
        )}
      </button>
      <div>
        <button
          type="button"
          className="text-sm text-primary underline-offset-2 hover:underline disabled:opacity-50"
          onClick={() => inputRef.current?.click()}
          disabled={isPending}
        >
          {isPending ? "업로드 중…" : "이미지 변경"}
        </button>
        {isError && (
          <p role="alert" className="mt-1 text-xs text-destructive">
            {error?.message ?? "업로드에 실패했습니다."}
          </p>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={handleFileChange}
        disabled={isPending}
      />
    </div>
  );
}

export function ProfileForm() {
  const { data } = useQuery(accountQueries.me());
  const [displayName, setDisplayName] = useState(data?.user.displayName ?? "");
  const { mutate, isPending, isError, error } = useUpdateProfile();

  const currentName = data?.user.displayName ?? "";
  if (displayName === "" && currentName !== "") {
    setDisplayName(currentName);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutate({ displayName });
  }

  return (
    <div className="space-y-6">
      <AvatarSection />
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
    </div>
  );
}
