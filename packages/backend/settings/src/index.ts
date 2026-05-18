/**
 * @repo/backend-settings — backend 공통 config 진입점.
 *
 * `@env-kit/node-settings`의 풍부한 API를 그대로 re-export하고,
 * boilerplate-specific 추가(BaseBackendSchema, BackendSettingsModule)를 제공.
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

/**
 * NestJS DI injection token. 호출자는 `@Inject(BACKEND_SETTINGS)`로
 * 주입된 typed settings 객체에 접근한다.
 */
export const BACKEND_SETTINGS = Symbol("BACKEND_SETTINGS");

/**
 * Loader 호출 결과를 NestJS DI 컨테이너에 *전역 provider*로 박는 thin adapter.
 *
 * 라이브러리(`@env-kit/node-settings`)의 `defineSettings`로 만든 loader를
 * 받고, 부트 시점의 env(기본 `process.env`)로 호출해 *frozen typed settings*를
 * `BACKEND_SETTINGS` symbol provider로 노출.
 *
 * @example
 * ```ts
 * const loadSettings = defineSettings({ ... });
 *
 * @Module({
 *   imports: [BackendSettingsModule.forRoot(loadSettings)],
 * })
 * export class AppModule {}
 *
 * @Injectable()
 * export class SomeService {
 *   constructor(@Inject(BACKEND_SETTINGS) private readonly settings: AppSettings) {}
 * }
 * ```
 */
export const BackendSettingsModule = {
  forRoot<TSettings>(
    loader: (env: Record<string, string | undefined>) => TSettings,
    env: Record<string, string | undefined> = process.env,
  ) {
    const settings = loader(env);
    return {
      module: BackendSettingsModule,
      providers: [{ provide: BACKEND_SETTINGS, useValue: settings }],
      exports: [BACKEND_SETTINGS],
      global: true,
    };
  },
};
