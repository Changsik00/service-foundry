"use client";

import type * as React from "react";
import type { ControllerProps, FieldPath, FieldValues, UseFormReturn } from "react-hook-form";

// stub — TDD Green 단계에서 구현. 시그니처만 박아 typecheck 통과.

// biome-ignore lint/suspicious/noExplicitAny: stub — Green 단계에서 정확 시그니처
export const Form = <_T extends FieldValues = any>(
  _props: {
    children?: React.ReactNode;
  } & UseFormReturn<_T>,
): React.ReactNode => {
  throw new Error("not implemented");
};

export const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
  _props: ControllerProps<TFieldValues, TName>,
): React.ReactNode => {
  throw new Error("not implemented");
};

export const FormItem: React.FC<{ children?: React.ReactNode; className?: string }> = () => {
  throw new Error("not implemented");
};

export const FormLabel: React.FC<{ children?: React.ReactNode; className?: string }> = () => {
  throw new Error("not implemented");
};

export const FormControl: React.FC<{ children?: React.ReactNode; className?: string }> = () => {
  throw new Error("not implemented");
};

export const FormDescription: React.FC<{
  children?: React.ReactNode;
  className?: string;
}> = () => {
  throw new Error("not implemented");
};

export const FormMessage: React.FC<{ children?: React.ReactNode; className?: string }> = () => {
  throw new Error("not implemented");
};
