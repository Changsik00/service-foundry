import type { Registry } from "prom-client";

export interface AuthMetrics {
  registry: Registry;
  recordLoginAttempt(): void;
  recordLoginSuccess(): void;
  recordLoginFailure(): void;
  metricsText(): Promise<string>;
}

// TDD 스텁 — 구현은 Green 단계.
export function createAuthMetrics(): AuthMetrics {
  throw new Error("not implemented");
}
