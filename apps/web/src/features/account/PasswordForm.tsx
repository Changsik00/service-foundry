"use client";

import { Button, Label, PasswordInput } from "@repo/frontend-ui";
import { useState } from "react";

import { useChangePassword } from "./mutations";

export function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const { mutate, isPending, isError, error } = useChangePassword();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setConfirmError("새 비밀번호가 일치하지 않습니다.");
      return;
    }
    setConfirmError(null);
    mutate({ currentPassword, newPassword });
  }

  const displayError =
    confirmError ?? (isError ? (error?.message ?? "비밀번호 변경에 실패했습니다.") : null);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="currentPassword">현재 비밀번호</Label>
        <PasswordInput
          id="currentPassword"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoComplete="current-password"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="newPassword">새 비밀번호</Label>
        <PasswordInput
          id="newPassword"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
        <PasswordInput
          id="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
        />
      </div>
      {displayError && (
        <p role="alert" className="text-sm text-destructive">
          {displayError}
        </p>
      )}
      <Button type="submit" disabled={isPending}>
        {isPending ? "변경 중…" : "변경"}
      </Button>
    </form>
  );
}
