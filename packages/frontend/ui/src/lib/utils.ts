import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * shadcn 표준 `cn` utility — class 병합 + tailwind 중복 해소.
 *
 * @example
 * ```tsx
 * <button className={cn("px-2", isActive && "bg-primary", className)} />
 * ```
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
