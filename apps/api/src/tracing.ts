/**
 * OTEL 추적 부트스트랩 — main.ts 최상단에서 가장 먼저 import 되어야 한다
 * (자동계측이 @nestjs/* · pg · http 모듈 require 전에 패치하도록).
 *
 * OTEL_EXPORTER_OTLP_ENDPOINT 미설정 시 no-op (opt-in).
 */

import { startTracing } from "@repo/backend-observability";

startTracing(process.env, { serviceName: "api" });
