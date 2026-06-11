"use client";

import * as React from "react";

import { cn } from "../lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // DESIGN §5.2 — 경계는 ring-shadow(border 금지), 16px(iOS 줌 방지). 포커스는 전역 :focus-visible.
          "flex h-9 w-full rounded-md bg-background px-3 py-1 text-base shadow-ring transition-shadow placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:shadow-[0_0_0_1.5px_var(--color-error)]",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";
