/**
 * @repo/backend-settings — backend 공통 config 진입점 (pure, framework-agnostic).
 *
 * `@env-kit/node-settings`의 풍부한 API를 re-export하고,
 * boilerplate-specific 추가(BaseBackendSchema)를 제공.
 *
 * NestJS DI 어댑터는 `@repo/nestjs-settings` (ADR-0015).
 */
import { z } from "zod";

export {
  DEFAULT_DOCS_BASE,
  DEFAULT_SECRET_PATTERNS,
  defineSettings,
  introspectEnvSchema,
  NodeSettingsError,
  presets,
} from "@env-kit/node-settings";

/**
 * 모든 backend app이 공유하는 *최소* env 표준. 호출자는
 * `BaseBackendSchema.extend({ ... })`로 자체 env를 추가한다.
 *
 * - NODE_ENV: 4 환경 (development / test / staging / production)
 * - PORT: 1~65535, 기본 3000
 * - LOG_LEVEL: pino 호환 6 단계, 기본 info
 */
export const BaseBackendSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "staging", "production"]),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]).default("info"),
});

export type BaseBackendInput = z.input<typeof BaseBackendSchema>;
export type BaseBackendOutput = z.output<typeof BaseBackendSchema>;

export {
  DEFAULT_REDACT_KEYS,
  DEFAULT_REDACT_SUBSTRINGS,
  MASK,
  type MaskOptions,
  maskConfig,
} from "./mask.js";
