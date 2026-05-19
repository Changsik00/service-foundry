import type { LoggerService } from "@nestjs/common";
import {
  type CreateLoggerOptions,
  createLogger,
  getCurrentRequestId,
  type Logger,
} from "@repo/backend-logger";

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
