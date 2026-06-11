"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "../lib/utils";

// DESIGN.md §5.1 — radius 8 고정(rounded-md), pill 금지. 포커스 링은 전역 :focus-visible 가 처리.
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors duration-100 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        /** Primary — 화면당 1개 (DESIGN §5.1). hover 는 어두워짐 */
        default: "bg-primary text-primary-foreground hover:bg-brand-hover active:bg-brand-active",
        /** Secondary — 흰 배경 + ring 경계 */
        secondary: "bg-background text-foreground shadow-ring hover:bg-accent",
        ghost: "text-secondary-foreground hover:bg-accent hover:text-accent-foreground",
        /** Destructive — Primary 와 같은 모달 공존 금지 (Ghost 취소와 조합) */
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-error-text active:bg-error-text",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-7 px-2.5 text-[13px]",
        /** md ⭐ 콘솔 기본 (36px) */
        default: "h-9 px-3.5",
        /** lg — auth CTA 전용 (44px) */
        lg: "h-11 px-4 font-semibold",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";
