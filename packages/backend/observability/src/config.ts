export interface TracingConfig {
  enabled: boolean;
  serviceName: string;
  endpoint: string;
  sampleRatio: number;
}

export interface TracingDefaults {
  serviceName?: string;
}

// TDD 스텁 — 구현은 Green 단계.
export function resolveTracingConfig(
  _env: Record<string, string | undefined>,
  _defaults: TracingDefaults = {},
): TracingConfig {
  throw new Error("not implemented");
}
