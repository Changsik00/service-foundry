/**
 * @repo/frontend-ui — shared shadcn-style component registry for monorepo.
 *
 * - `cn(...inputs)` — class merge utility (clsx + tailwind-merge)
 * - components: Button / Input / Label / Card / Form / Toaster (각 task 에서 추가)
 *
 * 호출자 (Next.js / Vite app):
 * ```css
 * @import "@repo/frontend-ui/styles.css";
 * ```
 *
 * ```tsx
 * import { Button } from "@repo/frontend-ui";
 * ```
 *
 * 본 패키지는 ADR-0015 (framework-adapter naming/layout) 답습 — `packages/frontend/ui/`.
 */

export {
  HealthCard,
  type HealthCardProps,
  type HealthData,
} from "./blocks/health-card";
export { ThemeToggle } from "./blocks/theme-toggle";
export { Button, type ButtonProps, buttonVariants } from "./components/button";
export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./components/card";
export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./components/dropdown-menu";
export {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./components/form";
export { Input, type InputProps } from "./components/input";
export { Label, type LabelProps } from "./components/label";
export { PasswordInput, type PasswordInputProps } from "./components/password-input";
export { Toaster, toast } from "./components/toaster";
export { ThemeProvider, type ThemeProviderProps, useTheme } from "./lib/theme-context";
export { cn } from "./lib/utils";
