import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import type { LoggerService } from "@nestjs/common";
import pino, { type DestinationStream, type Logger } from "pino";

export const DEFAULT_REDACT_PATHS = [
  "password",
  "*.password",
  "token",
  "*.token",
  "authorization",
  "headers.authorization",
  "cookie",
  "headers.cookie",
  "secret",
  "*.secret",
  "api_key",
  "apiKey",
  "*.api_key",
  "*.apiKey",
];

export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

export interface CreateLoggerOptions {
  level: LogLevel;
  redact?: string[];
  pretty?: boolean;
}

export const createLogger = (
  options: CreateLoggerOptions,
  destination?: DestinationStream,
): Logger => {
  const redact = [...DEFAULT_REDACT_PATHS, ...(options.redact ?? [])];
  const baseOptions = {
    level: options.level,
    redact,
  };

  if (destination) {
    return pino(baseOptions, destination);
  }

  if (options.pretty) {
    return pino({
      ...baseOptions,
      transport: { target: "pino-pretty", options: { colorize: true } },
    });
  }

  return pino(baseOptions);
};

interface RequestContext {
  requestId: string;
}

const requestStore = new AsyncLocalStorage<RequestContext>();

export const runWithRequestId = <T>(requestId: string, fn: () => T): T =>
  requestStore.run({ requestId }, fn);

export const getCurrentRequestId = (): string | undefined => requestStore.getStore()?.requestId;

export const generateRequestId = (): string => randomUUID();

export interface RequestIdMiddlewareOptions {
  header?: string;
}

interface MinimalRequest {
  headers: Record<string, unknown>;
}

export const requestIdMiddleware = (options: RequestIdMiddlewareOptions = {}) => {
  const headerName = (options.header ?? "X-Request-Id").toLowerCase();
  return (req: MinimalRequest, _res: unknown, next: () => void): void => {
    const incoming = req.headers[headerName];
    const requestId =
      typeof incoming === "string" && incoming.length > 0 ? incoming : generateRequestId();
    requestStore.run({ requestId }, next);
  };
};

export class PinoLoggerService implements LoggerService {
  constructor(private readonly logger: Logger) {}

  private withContext(context?: string): Logger {
    const reqId = getCurrentRequestId();
    const bindings: Record<string, string> = {};
    if (context) bindings.context = context;
    if (reqId) bindings.reqId = reqId;
    return this.logger.child(bindings);
  }

  log(message: unknown, context?: string): void {
    this.withContext(context).info(message);
  }

  error(message: unknown, trace?: string, context?: string): void {
    this.withContext(context).error({ trace }, String(message));
  }

  warn(message: unknown, context?: string): void {
    this.withContext(context).warn(message);
  }

  debug(message: unknown, context?: string): void {
    this.withContext(context).debug(message);
  }

  verbose(message: unknown, context?: string): void {
    this.withContext(context).trace(message);
  }

  fatal(message: unknown, context?: string): void {
    this.withContext(context).fatal(message);
  }
}

export const BACKEND_LOGGER = Symbol("BACKEND_LOGGER");

interface LoggerDynamicModuleProvider {
  provide: symbol | typeof PinoLoggerService;
  useValue: unknown;
}

interface LoggerDynamicModule {
  module: typeof BackendLoggerModule;
  providers: LoggerDynamicModuleProvider[];
  exports: (symbol | typeof PinoLoggerService)[];
  global: true;
}

export const BackendLoggerModule = {
  forRoot(options: CreateLoggerOptions): LoggerDynamicModule {
    const logger = createLogger(options);
    const service = new PinoLoggerService(logger);
    return {
      module: BackendLoggerModule,
      providers: [
        { provide: BACKEND_LOGGER, useValue: logger },
        { provide: PinoLoggerService, useValue: service },
      ],
      exports: [BACKEND_LOGGER, PinoLoggerService],
      global: true,
    };
  },
};
