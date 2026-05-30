import "./tracing.js"; // OTEL 자동계측 — 다른 import 보다 먼저 (env-gated, opt-in)
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { maskConfig } from "@repo/backend-settings";
import { PinoLoggerService } from "@repo/nestjs-logger";
import { applySecurity } from "@repo/nestjs-security";
import cookieParser from "cookie-parser";

import { AppModule } from "./app.module.js";
import { loadSettings } from "./settings.js";

async function bootstrap(): Promise<void> {
  const settings = loadSettings(process.env);

  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.use(cookieParser());
  const logger = app.get(PinoLoggerService);
  app.useLogger(logger);

  // startup report — 로드된 config 를 시크릿 마스킹하여 1회 출력 (spec-10-03)
  logger.log(`startup config: ${JSON.stringify(maskConfig(settings))}`, "Bootstrap");

  applySecurity(app, {
    cors: { origin: settings.CORS_ORIGIN, credentials: true },
  });

  await app.listen(settings.PORT);

  const url = await app.getUrl();
  logger.log(`🚀 API listening on ${url}`, "Bootstrap");
}

bootstrap();
