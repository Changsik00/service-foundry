/**
 * OTEL NodeSDK 구성/기동.
 *
 * OTLP(proto/http) exporter + Node 자동계측(http/express/pg) + service.name resource.
 * 샘플링은 OTEL 표준 env(OTEL_TRACES_SAMPLER / _ARG)로 NodeSDK 가 자동 적용.
 */

import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";

import { resolveTracingConfig, type TracingConfig, type TracingDefaults } from "./config.js";

/** 활성 설정으로 NodeSDK 인스턴스 구성 (start 는 호출자 책임). */
export function createTracingSdk(config: TracingConfig): NodeSDK {
  const exporter = new OTLPTraceExporter({
    url: `${config.endpoint.replace(/\/$/, "")}/v1/traces`,
  });
  return new NodeSDK({
    resource: resourceFromAttributes({ [ATTR_SERVICE_NAME]: config.serviceName }),
    traceExporter: exporter,
    instrumentations: [getNodeAutoInstrumentations()],
  });
}

/**
 * env 기반 opt-in 기동.
 * OTLP endpoint 미설정(비활성)이면 null 반환(no-op). 활성이면 SDK start 후 반환.
 */
export function startTracing(
  env: Record<string, string | undefined>,
  defaults: TracingDefaults = {},
): NodeSDK | null {
  const config = resolveTracingConfig(env, defaults);
  if (!config.enabled) return null;
  const sdk = createTracingSdk(config);
  sdk.start();
  return sdk;
}
