import { type DynamicModule, type LoggerService, Module } from "@nestjs/common";
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

// biome-ignore lint/complexity/noStaticOnlyClass: NestJS @Module pattern requires class with static forRoot (ADR-0016)
@Module({})
export class BackendLoggerModule {
  static forRoot(options: CreateLoggerOptions): DynamicModule {
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
  }
}
