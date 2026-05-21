import { Module } from "@nestjs/common";
import { DatabaseModule } from "@repo/nestjs-database";
import { HttpClientModule } from "@repo/nestjs-http-client";
import { BackendLoggerModule } from "@repo/nestjs-logger";
import { BackendThrottlerModule } from "@repo/nestjs-security";
import { BackendSettingsModule } from "@repo/nestjs-settings";

import { HealthController } from "./health/health.controller.js";
import { appSchema } from "./infra/schema/index.js";
import { JwtModule } from "./jwt/jwt.module.js";
import { type AppSettings, loadSettings } from "./settings.js";

const settings: AppSettings = loadSettings(process.env);

@Module({
  imports: [
    BackendSettingsModule.forRoot(loadSettings),
    BackendLoggerModule.forRoot({ level: settings.LOG_LEVEL }),
    HttpClientModule.forRoot({ baseUrl: settings.HTTP_CLIENT_BASE_URL }),
    DatabaseModule.forRoot({ connectionUrl: settings.DATABASE_URL, schema: appSchema }),
    BackendThrottlerModule.forRoot(),
    JwtModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
