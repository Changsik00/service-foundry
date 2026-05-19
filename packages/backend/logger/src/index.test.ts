import { Writable } from "node:stream";
import type { Logger } from "pino";
import { describe, expect, it, vi } from "vitest";

import {
  createLogger,
  DEFAULT_REDACT_PATHS,
  generateRequestId,
  getCurrentRequestId,
  PinoLoggerService,
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
    // crypto.randomUUID() format check (loose)
    expect(captured).toMatch(/^[0-9a-f-]{36}$/i);
    expect(typeof generateRequestId()).toBe("string");
    vi.restoreAllMocks();
  });
});

describe("PinoLoggerService", () => {
  const makeMockLogger = () => {
    const calls: { method: string; args: unknown[] }[] = [];
    const childCalls: object[] = [];
    const child = {
      info: (...a: unknown[]) => calls.push({ method: "info", args: a }),
      error: (...a: unknown[]) => calls.push({ method: "error", args: a }),
      warn: (...a: unknown[]) => calls.push({ method: "warn", args: a }),
      debug: (...a: unknown[]) => calls.push({ method: "debug", args: a }),
      trace: (...a: unknown[]) => calls.push({ method: "trace", args: a }),
      fatal: (...a: unknown[]) => calls.push({ method: "fatal", args: a }),
    };
    const root = {
      child: (bindings: object) => {
        childCalls.push(bindings);
        return child;
      },
    };
    return { root: root as unknown as Logger, calls, childCalls };
  };

  it("routes 6 NestJS methods to matching pino levels", () => {
    const mock = makeMockLogger();
    const service = new PinoLoggerService(mock.root);

    service.log("hello", "AppCtx");
    service.error("boom", "stack-trace", "AppCtx");
    service.warn("careful", "AppCtx");
    service.debug("dbg", "AppCtx");
    service.verbose("vrb", "AppCtx");
    service.fatal("dead", "AppCtx");

    const methods = mock.calls.map((c) => c.method);
    expect(methods).toEqual(["info", "error", "warn", "debug", "trace", "fatal"]);
  });

  it("attaches reqId via child logger when inside runWithRequestId", () => {
    const mock = makeMockLogger();
    const service = new PinoLoggerService(mock.root);

    runWithRequestId("req-xyz-789", () => {
      service.log("inside", "Ctx");
    });

    const lastChildBindings = mock.childCalls[mock.childCalls.length - 1] as Record<
      string,
      unknown
    >;
    expect(lastChildBindings.reqId).toBe("req-xyz-789");
    expect(lastChildBindings.context).toBe("Ctx");
  });
});
