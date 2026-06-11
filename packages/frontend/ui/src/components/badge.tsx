import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "../lib/utils";

/** 상태 배지 — height 20px pill, 12px/500. 색+텍스트 병행 (DESIGN §5.7) */
const badgeVariants = cva(
  "inline-flex h-5 items-center whitespace-nowrap rounded-full px-2 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "bg-secondary text-secondary-foreground",
        brand: "bg-brand-soft text-primary",
        success: "bg-success-bg text-success-text",
        warning: "bg-warning-bg text-warning-text",
        error: "bg-error-bg text-error-text",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
