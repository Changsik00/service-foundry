import { type AuthMetrics, createAuthMetrics } from "@repo/backend-observability";

/** @Inject 토큰 — auth controller / metrics controller 가 공유하는 단일 AuthMetrics. */
export const AUTH_METRICS = Symbol("AUTH_METRICS");

export const authMetricsProvider = {
  provide: AUTH_METRICS,
  useFactory: (): AuthMetrics => createAuthMetrics(),
};
