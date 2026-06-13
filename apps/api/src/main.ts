import "./tracing.js"; // OTEL 자동계측 — 다른 import 보다 먼저 (env-gated, opt-in)
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import type { Lifecycle } from "@repo/backend-lifecycle";
import { maskConfig } from "@repo/backend-settings";
import { PinoLoggerService } from "@repo/nestjs-logger";

import { AppModule } from "./app.module.js";
import { configureApp } from "./app.setup.js";
import { LIFECYCLE } from "./lifecycle/lifecycle.provider.js";
import { loadSettings } from "./settings.js";

async function bootstrap(): Promise<void> {
  const settings = loadSettings(process.env);

  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  // 미들웨어 배선(requestId + cookieParser + helmet/CORS)은 app.setup 의 configureApp 가 SoT (C1 / spec-16-02)
  configureApp(app, { corsOrigin: settings.CORS_ORIGIN });
  const logger = app.get(PinoLoggerService);
  app.useLogger(logger);

  // startup report — 로드된 config 를 시크릿 마스킹하여 1회 출력 (spec-10-03)
  logger.log(`startup config: ${JSON.stringify(maskConfig(settings))}`, "Bootstrap");

  // graceful shutdown — SIGTERM 시 readiness=false(LB 차단) 후 app.close 드레인 (spec-12-04)
  const lifecycle = app.get<Lifecycle>(LIFECYCLE);
  lifecycle.onShutdown(async () => {
    await app.close();
  });
  const onSignal = (signal: string): void => {
    logger.log(`${signal} 수신 — graceful shutdown 시작`, "Bootstrap");
    void lifecycle.shutdown({ timeoutMs: 10_000 }).finally(() => process.exit(0));
  };
  process.on("SIGTERM", () => onSignal("SIGTERM"));
  process.on("SIGINT", () => onSignal("SIGINT"));

  if (settings.SWAGGER_ENABLED) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("Service Foundry API")
      .setDescription("Service Foundry 백엔드 API")
      .setVersion("1.0")
      .addBearerAuth({ type: "http", scheme: "bearer", bearerFormat: "JWT" }, "access-token")
      .addCookieAuth("refresh_token")
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("api-docs", app, document);
    logger.log("Swagger UI available at /api-docs", "Bootstrap");
  }

  await app.listen(settings.PORT);

  const url = await app.getUrl();
  logger.log(`🚀 API listening on ${url}`, "Bootstrap");
}

bootstrap();
