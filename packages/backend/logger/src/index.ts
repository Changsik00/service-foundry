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
