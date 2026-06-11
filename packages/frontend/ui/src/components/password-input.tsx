"use client";

import * as React from "react";

import { cn } from "../lib/utils";
import { Input, type InputProps } from "./input";

function EyeIcon({ off }: { off: boolean }) {
  // lucide eye/eye-off 패스 (인라인 — 외부 아이콘 dep 없이)
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="presentation"
      aria-hidden="true"
    >
      {off ? (
        <>
          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
          <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
          <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
          <line x1="2" x2="22" y1="2" y2="22" />
        </>
      ) : (
        <>
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );
}

export type PasswordInputProps = Omit<InputProps, "type">;

/**
 * 비밀번호 인풋 + 표시 토글 (DESIGN §6.1 "우측 표시 토글").
 * icon-only 버튼 — aria-label 필수 규칙 준수 (FRONT §6.2).
 */
export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);
    return (
      <div className="relative">
        <Input
          ref={ref}
          type={visible ? "text" : "password"}
          className={cn("pr-10", className)}
          {...props}
        />
        <button
          type="button"
          aria-label={visible ? "비밀번호 숨기기" : "비밀번호 표시"}
          onClick={() => setVisible((v) => !v)}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-sm p-1.5 text-muted-foreground transition-colors duration-100 hover:text-foreground"
          tabIndex={-1}
        >
          <EyeIcon off={visible} />
        </button>
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";
