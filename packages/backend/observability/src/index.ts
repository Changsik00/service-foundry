/**
 * @repo/backend-observability — framework-agnostic OTEL 추적 기반 (ADR-0015 core).
 *
 * NestJS 등 framework 배선은 각 앱/어댑터에서 `startTracing` 를 부트 최상단에 호출.
 */

export {
  resolveTracingConfig,
  type TracingConfig,
  type TracingDefaults,
} from "./config.js";
export { createTracingSdk, startTracing } from "./tracing.js";
