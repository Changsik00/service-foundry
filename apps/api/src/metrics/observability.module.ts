import { Global, Module } from "@nestjs/common";

import { AUTH_METRICS, authMetricsProvider } from "./auth-metrics.provider.js";
import { MetricsController } from "./metrics.controller.js";

/** @Global — AUTH_METRICS 를 앱 전역(AuthModule 의 controller 포함)에서 주입 가능하게. */
@Global()
@Module({
  controllers: [MetricsController],
  providers: [authMetricsProvider],
  exports: [AUTH_METRICS],
})
export class ObservabilityModule {}
