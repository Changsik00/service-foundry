/**
 * 스모크용 — known traceId span 한 개를 OTLP endpoint 로 방출하고 traceId 를 stdout 출력.
 * 통합 테스트(smoke-trace.sh)에서 tempo query 로 재조회해 export 경로를 검증한다.
 */

import { trace } from "@opentelemetry/api";

import { createTracingSdk } from "./src/index.js";

const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
if (!endpoint) {
  process.stderr.write("OTEL_EXPORTER_OTLP_ENDPOINT 필요\n");
  process.exit(1);
}

const sdk = createTracingSdk({
  enabled: true,
  serviceName: "smoke-emitter",
  endpoint,
  sampleRatio: 1,
});
sdk.start();

const span = trace.getTracer("smoke").startSpan("smoke-span");
const traceId = span.spanContext().traceId;
span.end();

await sdk.shutdown(); // BatchSpanProcessor flush
process.stdout.write(traceId);
