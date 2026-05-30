import { ServiceUnavailableException } from "@nestjs/common";
import { createLifecycle } from "@repo/backend-lifecycle";
import { describe, expect, it } from "vitest";
import { HealthController } from "./health.controller.js";

describe("HealthController", () => {
  it("health: status ok", () => {
    expect(new HealthController(createLifecycle()).health().status).toBe("ok");
  });

  it("live: 항상 live (liveness)", () => {
    expect(new HealthController(createLifecycle()).live()).toEqual({ status: "live" });
  });

  it("ready: 준비됨이면 200 ready", () => {
    expect(new HealthController(createLifecycle({ ready: true })).ready()).toEqual({
      status: "ready",
    });
  });

  it("ready: 종료 드레인 중(not-ready)이면 503", () => {
    const lc = createLifecycle();
    lc.setReady(false);
    expect(() => new HealthController(lc).ready()).toThrow(ServiceUnavailableException);
  });
});
