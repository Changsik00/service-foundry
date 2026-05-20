import { runWithRequestId } from "@repo/backend-logger";
import type { Logger } from "pino";
import { describe, expect, it } from "vitest";

import { BACKEND_LOGGER, BackendLoggerModule, PinoLoggerService } from "./index.js";

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

describe("BackendLoggerModule", () => {
  it("forRoot returns DynamicModule structure (module / providers / exports / global)", () => {
    const dynamicModule = BackendLoggerModule.forRoot({ level: "info" });
    expect(dynamicModule.module).toBe(BackendLoggerModule);
    expect(dynamicModule.global).toBe(true);
    expect(Array.isArray(dynamicModule.providers)).toBe(true);
    expect(Array.isArray(dynamicModule.exports)).toBe(true);
  });

  it("exposes both BACKEND_LOGGER and PinoLoggerService providers", () => {
    const dynamicModule = BackendLoggerModule.forRoot({ level: "warn" });
    const providers = dynamicModule.providers ?? [];
    // biome-ignore lint/suspicious/noExplicitAny: NestJS Provider union narrowing — test 검증용 단순화
    const providerTokens = providers.map((p: any) => p.provide);
    expect(providerTokens).toContain(BACKEND_LOGGER);
    expect(providerTokens).toContain(PinoLoggerService);
    expect(dynamicModule.exports).toContain(BACKEND_LOGGER);
    expect(dynamicModule.exports).toContain(PinoLoggerService);

    // biome-ignore lint/suspicious/noExplicitAny: NestJS Provider union narrowing — test 검증용 단순화
    const serviceProvider = providers.find((p: any) => p.provide === PinoLoggerService) as
      | { provide: typeof PinoLoggerService; useValue: PinoLoggerService }
      | undefined;
    expect(serviceProvider?.useValue).toBeInstanceOf(PinoLoggerService);
  });
});
