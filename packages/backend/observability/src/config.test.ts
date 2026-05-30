import { describe, expect, it } from "vitest";
import { resolveTracingConfig } from "./config.js";

describe("resolveTracingConfig", () => {
  it("OTLP endpoint 미설정 → 비활성", () => {
    const c = resolveTracingConfig({});
    expect(c.enabled).toBe(false);
    expect(c.endpoint).toBe("");
  });

  it("OTLP endpoint 설정 → 활성 + endpoint 반영", () => {
    const c = resolveTracingConfig({
      OTEL_EXPORTER_OTLP_ENDPOINT: "http://localhost:4318",
    });
    expect(c.enabled).toBe(true);
    expect(c.endpoint).toBe("http://localhost:4318");
  });

  it("serviceName: OTEL_SERVICE_NAME > defaults > fallback", () => {
    expect(resolveTracingConfig({ OTEL_SERVICE_NAME: "api" }).serviceName).toBe("api");
    expect(resolveTracingConfig({}, { serviceName: "worker" }).serviceName).toBe("worker");
    expect(resolveTracingConfig({}).serviceName).toBe("service-foundry");
  });

  it("sampleRatio: 기본 1.0, env 반영 + 0~1 clamp", () => {
    expect(resolveTracingConfig({}).sampleRatio).toBe(1);
    expect(resolveTracingConfig({ OTEL_TRACES_SAMPLER_ARG: "0.25" }).sampleRatio).toBe(0.25);
    expect(resolveTracingConfig({ OTEL_TRACES_SAMPLER_ARG: "5" }).sampleRatio).toBe(1);
    expect(resolveTracingConfig({ OTEL_TRACES_SAMPLER_ARG: "-1" }).sampleRatio).toBe(0);
  });

  it("빈 문자열 endpoint 는 비활성 취급", () => {
    expect(resolveTracingConfig({ OTEL_EXPORTER_OTLP_ENDPOINT: "" }).enabled).toBe(false);
  });
});
