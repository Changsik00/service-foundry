/**
 * apps/api 의 settings loader.
 *
 * `BaseBackendSchema` (NODE_ENV / PORT / LOG_LEVEL) 위에 app-specific env 박음:
 * - DATABASE_URL: PostgreSQL connection URL (pg-style)
 * - HTTP_CLIENT_BASE_URL: 외부 API base URL
 *
 * 호출자: `AppModule.imports` 의 `BackendSettingsModule.forRoot(loadSettings)`.
 */
import { BaseBackendSchema, defineSettings } from "@repo/backend-settings";
import { z } from "zod";

const AppSettingsSchema = BaseBackendSchema.extend({
  DATABASE_URL: z.string().min(1),
  HTTP_CLIENT_BASE_URL: z.string().url(),
});

export type AppSettings = z.output<typeof AppSettingsSchema>;

export const loadSettings = defineSettings({
  envSchema: AppSettingsSchema,
  envKey: "NODE_ENV",
  defaults: {},
  perEnv: {
    development: {},
    test: {},
    staging: {},
    production: {},
  },
  build: (env, _layered) => env,
});
