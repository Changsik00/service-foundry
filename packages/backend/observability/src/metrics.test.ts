import { describe, expect, it } from "vitest";
import { createAuthMetrics } from "./metrics.js";

describe("createAuthMetrics", () => {
  it("초기엔 카운터 3종이 0 으로 노출된다", async () => {
    const m = createAuthMetrics();
    const text = await m.metricsText();
    expect(text).toContain("auth_login_attempts_total");
    expect(text).toContain("auth_login_success_total");
    expect(text).toContain("auth_login_failure_total");
  });

  it("record* 가 카운터를 증가시킨다", async () => {
    const m = createAuthMetrics();
    m.recordLoginAttempt();
    m.recordLoginAttempt();
    m.recordLoginFailure();
    const text = await m.metricsText();
    expect(text).toMatch(/auth_login_attempts_total\s+2/);
    expect(text).toMatch(/auth_login_failure_total\s+1/);
    expect(text).toMatch(/auth_login_success_total\s+0/);
  });

  it("metricsText 는 prometheus text format (# HELP/# TYPE 포함)", async () => {
    const text = await createAuthMetrics().metricsText();
    expect(text).toContain("# TYPE auth_login_attempts_total counter");
  });
});
