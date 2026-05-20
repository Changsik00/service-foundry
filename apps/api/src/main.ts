import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { PinoLoggerService } from "@repo/nestjs-logger";
import { applySecurity } from "@repo/nestjs-security";

import { AppModule } from "./app.module.js";
import { loadSettings } from "./settings.js";

async function bootstrap(): Promise<void> {
  const settings = loadSettings(process.env);

  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(PinoLoggerService));
  applySecurity(app);

  await app.listen(settings.PORT);
}

bootstrap();
