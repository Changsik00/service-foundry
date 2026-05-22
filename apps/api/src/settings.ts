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
  JWT_ISSUER: z.string().min(1).default("http://localhost:3000"),
  JWT_AUDIENCE: z.string().min(1).default("http://localhost:3000"),
  OAUTH_STATE_SECRET: z.string().min(1).default("dev-secret-change-in-production"),
  OAUTH_REDIRECT_BASE_URL: z.string().url().default("http://localhost:3000"),
  GOOGLE_CLIENT_ID: z.string().default(""),
  GOOGLE_CLIENT_SECRET: z.string().default(""),
  KAKAO_CLIENT_ID: z.string().default(""),
  KAKAO_CLIENT_SECRET: z.string().default(""),
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
