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
  CORS_ORIGIN: z.string().url().default("http://localhost:2027"),
  JWT_ISSUER: z.string().min(1).default("http://localhost:3000"),
  JWT_AUDIENCE: z.string().min(1).default("http://localhost:3000"),
  OAUTH_STATE_SECRET: z.string().min(1).default("dev-secret-change-in-production"),
  CSRF_SECRET: z.string().min(1).default("dev-secret-change-in-production"),
  OAUTH_REDIRECT_BASE_URL: z.string().url().default("http://localhost:3000"),
  GOOGLE_CLIENT_ID: z.string().default(""),
  GOOGLE_CLIENT_SECRET: z.string().default(""),
  KAKAO_CLIENT_ID: z.string().default(""),
  KAKAO_CLIENT_SECRET: z.string().default(""),
  PASSKEY_RP_ID: z.string().min(1).default("localhost"),
  PASSKEY_RP_NAME: z.string().min(1).default("service-foundry"),
  PASSKEY_ORIGIN: z.string().url().default("http://localhost:3000"),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().default("noreply@localhost"),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
});

export type AppSettings = z.output<typeof AppSettingsSchema>;

/** dev 기본 시크릿 — production 에서 이 값이면 기동 거부 (spec-16-02 phase-FF W3). */
const DEV_DEFAULT_SECRET = "dev-secret-change-in-production";

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
  build: (env, _layered) => {
    // production 기동 시 dev 기본 시크릿 거부 — 약한 시크릿로의 운영 기동 차단.
    if (env.NODE_ENV === "production") {
      const weak = (["CSRF_SECRET", "OAUTH_STATE_SECRET"] as const).filter(
        (key) => env[key] === DEV_DEFAULT_SECRET,
      );
      if (weak.length > 0) {
        throw new Error(
          `production 기동 거부: ${weak.join(", ")} 가 dev 기본값입니다. 강한 시크릿을 설정하세요.`,
        );
      }
      if (!env.RESEND_API_KEY) {
        throw new Error(
          "production 기동 거부: RESEND_API_KEY 가 설정되지 않았습니다. 이메일 발송을 위해 Resend API 키를 설정하세요.",
        );
      }
    }
    return env;
  },
});
