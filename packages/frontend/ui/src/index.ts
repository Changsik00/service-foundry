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
} from "./blocks/health-card.js";
export { ThemeToggle } from "./blocks/theme-toggle.js";
export { Button, type ButtonProps, buttonVariants } from "./components/button.js";
export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./components/card.js";
export {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./components/form.js";
export { Input, type InputProps } from "./components/input.js";
export { Label, type LabelProps } from "./components/label.js";
export { Toaster, toast } from "./components/toaster.js";
export { cn } from "./lib/utils.js";
