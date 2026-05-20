"use client";

import { Toaster as SonnerToaster, type ToasterProps } from "sonner";

/**
 * `Toaster` — sonner wrap. app root 또는 layout 에 1회 박음.
 *
 * @example
 * ```tsx
 * // app/layout.tsx
 * <body>
 *   {children}
 *   <Toaster />
 * </body>
 * ```
 *
 * Toast 호출: `import { toast } from "@repo/frontend-ui"` 후 `toast("Hello")`.
 */
export function Toaster(props: ToasterProps): React.ReactElement {
  return <SonnerToaster richColors closeButton position="top-right" {...props} />;
}

export { toast } from "sonner";
