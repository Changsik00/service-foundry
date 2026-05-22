import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
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
  applySecurity(app);

  await app.listen(settings.PORT);

  const url = await app.getUrl();
  logger.log(`🚀 API listening on ${url}`, "Bootstrap");
}

bootstrap();
