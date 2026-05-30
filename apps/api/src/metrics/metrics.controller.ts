import { Controller, Get, Header, Inject } from "@nestjs/common";
import type { AuthMetrics } from "@repo/backend-observability";

import { AUTH_METRICS } from "./auth-metrics.provider.js";

@Controller("metrics")
export class MetricsController {
  constructor(@Inject(AUTH_METRICS) private readonly metrics: AuthMetrics) {}

  @Get()
  @Header("Content-Type", "text/plain; version=0.0.4; charset=utf-8")
  scrape(): Promise<string> {
    return this.metrics.metricsText();
  }
}
