import { describe, expect, it } from "vitest";
import { createTracingSdk, startTracing } from "./tracing.js";

describe("tracing", () => {
  it("startTracing: 비활성 env → null (no-op)", () => {
    expect(startTracing({})).toBeNull();
    expect(startTracing({ OTEL_EXPORTER_OTLP_ENDPOINT: "" })).toBeNull();
  });

  it("createTracingSdk: shutdown 가능한 NodeSDK 반환 (start 미호출)", () => {
    const sdk = createTracingSdk({
      enabled: true,
      serviceName: "test-svc",
      endpoint: "http://localhost:4318",
      sampleRatio: 1,
    });
    expect(typeof sdk.shutdown).toBe("function");
    expect(typeof sdk.start).toBe("function");
  });
});
