/**
 * OTEL 추적 설정 해석 (순수 함수).
 *
 * env 만으로 enabled/endpoint/serviceName/sampleRatio 를 결정한다.
 * OTLP endpoint 미설정 시 비활성(no-op) — opt-in.
 */

export interface TracingConfig {
  enabled: boolean;
  serviceName: string;
  endpoint: string;
  sampleRatio: number;
}

export interface TracingDefaults {
  serviceName?: string;
}

const DEFAULT_SERVICE_NAME = "service-foundry";

const clamp01 = (n: number): number => Math.min(1, Math.max(0, n));

export function resolveTracingConfig(
  env: Record<string, string | undefined>,
  defaults: TracingDefaults = {},
): TracingConfig {
  const endpoint = env.OTEL_EXPORTER_OTLP_ENDPOINT?.trim() ?? "";
  const serviceName = env.OTEL_SERVICE_NAME?.trim() || defaults.serviceName || DEFAULT_SERVICE_NAME;

  const rawRatio = env.OTEL_TRACES_SAMPLER_ARG;
  const parsed = rawRatio === undefined ? 1 : Number.parseFloat(rawRatio);
  const sampleRatio = Number.isFinite(parsed) ? clamp01(parsed) : 1;

  return {
    enabled: endpoint.length > 0,
    serviceName,
    endpoint,
    sampleRatio,
  };
}
