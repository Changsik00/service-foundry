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
  // 런타임 접속 URL — 비-슈퍼유저 role(app_runtime)을 사용해야 RLS 테넌트 격리가 적용된다 (spec-17-07).
  DATABASE_URL: z.string().min(1),
  // 마이그레이션 전용 URL — owner/superuser. 미설정 시 drizzle.config 가 DATABASE_URL 로 폴백(로컬 단일 role).
  DATABASE_MIGRATE_URL: z.string().optional(),
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
  AUTH_MODE: z.enum(["native", "firebase", "supabase"]).default("native"),
  FIREBASE_SERVICE_ACCOUNT: z.string().optional(),
  FIREBASE_PROJECT_ID: z.string().optional(),
  SUPABASE_URL: z.string().url().optional(),
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
    // provider 모드 필수 env 가드 (환경 무관)
    if (env.AUTH_MODE === "firebase" && !env.FIREBASE_SERVICE_ACCOUNT) {
      throw new Error(
        "기동 거부: AUTH_MODE=firebase 이면 FIREBASE_SERVICE_ACCOUNT 를 설정해야 합니다.",
      );
    }
    if (env.AUTH_MODE === "supabase" && !env.SUPABASE_URL) {
      throw new Error("기동 거부: AUTH_MODE=supabase 이면 SUPABASE_URL 을 설정해야 합니다.");
    }
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
      // 런타임 접속이 슈퍼유저면 RLS 가 우회되어 테넌트 격리가 무력화된다 (spec-17-07 불변식).
      // postgres 는 관례적 슈퍼유저 — 운영에서 런타임 role 로 쓰지 못하게 막는다.
      let runtimeUser = "";
      try {
        runtimeUser = new URL(env.DATABASE_URL).username;
      } catch {
        // URL 파싱 실패는 별도 검증(min(1))에 위임 — 여기선 무시.
      }
      if (runtimeUser === "postgres") {
        throw new Error(
          "production 기동 거부: DATABASE_URL 런타임 접속이 슈퍼유저(postgres)입니다. RLS 테넌트 격리가 우회됩니다. 비-슈퍼유저 role(app_runtime 등)을 사용하세요.",
        );
      }
    }
    return env;
  },
});
