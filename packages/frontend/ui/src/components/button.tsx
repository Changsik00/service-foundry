"use client";

import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

// stub — TDD Green 단계에서 구현. variant / size 시그니처만 박음.
export const buttonVariants = cva("", {
  variants: {
    variant: {
      default: "",
      destructive: "",
      outline: "",
      secondary: "",
      ghost: "",
      link: "",
    },
    size: {
      default: "",
      sm: "",
      lg: "",
      icon: "",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>((_props, _ref) => {
  throw new Error("not implemented");
});
Button.displayName = "Button";
