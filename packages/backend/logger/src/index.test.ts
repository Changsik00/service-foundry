import { Writable } from "node:stream";
import { describe, expect, it, vi } from "vitest";

import {
  createLogger,
  DEFAULT_REDACT_PATHS,
  generateRequestId,
  getCurrentRequestId,
  requestIdMiddleware,
  runWithRequestId,
} from "./index.js";

const captureLines = () => {
  const lines: string[] = [];
  const stream = new Writable({
    write(chunk, _enc, cb) {
      lines.push(chunk.toString());
      cb();
    },
  });
  return { stream, lines };
};

describe("createLogger", () => {
  it("respects level — debug level emits debug, info level skips debug", () => {
    const debugCap = captureLines();
    const debugLogger = createLogger({ level: "debug" }, debugCap.stream);
    debugLogger.debug("debug-msg-A");
    expect(debugCap.lines.join("")).toContain("debug-msg-A");

    const infoCap = captureLines();
    const infoLogger = createLogger({ level: "info" }, infoCap.stream);
    infoLogger.debug("debug-msg-B");
    expect(infoCap.lines.join("")).toBe("");
  });

  it("redacts default secret paths (password / authorization)", () => {
    const cap = captureLines();
    const logger = createLogger({ level: "info" }, cap.stream);
    logger.info({
      password: "p@ss",
      headers: { authorization: "Bearer xyz" },
      user: "alice",
    });
    const out = cap.lines.join("");
    expect(out).not.toContain("p@ss");
    expect(out).not.toContain("Bearer xyz");
    expect(out).toContain("[Redacted]");
    expect(out).toContain("alice");
    expect(DEFAULT_REDACT_PATHS).toContain("password");
    expect(DEFAULT_REDACT_PATHS).toContain("headers.authorization");
  });

  it("accepts pretty option without throwing (transport wired)", () => {
    expect(() => createLogger({ level: "info", pretty: true })).not.toThrow();
  });
});

describe("requestId context", () => {
  it("runWithRequestId — inner code reads injected id via getCurrentRequestId", () => {
    runWithRequestId("req-abc-123", () => {
      expect(getCurrentRequestId()).toBe("req-abc-123");
    });
  });

  it("getCurrentRequestId — outside context returns undefined", () => {
    expect(getCurrentRequestId()).toBeUndefined();
  });

  it("requestIdMiddleware — uses X-Request-Id header when present", () => {
    const middleware = requestIdMiddleware();
    let captured: string | undefined;
    middleware({ headers: { "x-request-id": "incoming-id-42" } }, {}, () => {
      captured = getCurrentRequestId();
    });
    expect(captured).toBe("incoming-id-42");
  });

  it("requestIdMiddleware — generates new id when header missing", () => {
    const middleware = requestIdMiddleware();
    let captured: string | undefined;
    middleware({ headers: {} }, {}, () => {
      captured = getCurrentRequestId();
    });
    expect(captured).toBeTypeOf("string");
    expect(captured?.length ?? 0).toBeGreaterThan(0);
    expect(captured).toMatch(/^[0-9a-f-]{36}$/i);
    expect(typeof generateRequestId()).toBe("string");
    vi.restoreAllMocks();
  });
});
