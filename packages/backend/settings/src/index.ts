/**
 * @repo/backend-settings — backend 공통 config 진입점.
 *
 * `@env-kit/node-settings`의 풍부한 API를 그대로 re-export하고,
 * boilerplate-specific 추가(BaseBackendSchema, BackendSettingsModule)를 제공.
 */
export {
  DEFAULT_DOCS_BASE,
  DEFAULT_SECRET_PATTERNS,
  defineSettings,
  introspectEnvSchema,
  NodeSettingsError,
  presets,
} from "@env-kit/node-settings";
