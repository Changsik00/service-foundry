import { Module } from "@nestjs/common";
import { NestjsAuthModule } from "@repo/nestjs-auth";
import { DatabaseModule } from "@repo/nestjs-database";
import { HttpClientModule } from "@repo/nestjs-http-client";
import { BackendLoggerModule } from "@repo/nestjs-logger";
import { BackendThrottlerModule } from "@repo/nestjs-security";
import { BackendSettingsModule } from "@repo/nestjs-settings";

import { AuthModule } from "./auth/auth.module.js";
import { HealthController } from "./health/health.controller.js";
import { appSchema } from "./infra/schema/index.js";
import { JwtModule } from "./jwt/jwt.module.js";
import { JwtService } from "./jwt/jwt.service.js";
import { ObservabilityModule } from "./metrics/observability.module.js";
import { type AppSettings, loadSettings } from "./settings.js";

const settings: AppSettings = loadSettings(process.env);

@Module({
  imports: [
    BackendSettingsModule.forRoot(loadSettings),
    BackendLoggerModule.forRoot({ level: settings.LOG_LEVEL }),
    HttpClientModule.forRoot({ baseUrl: settings.HTTP_CLIENT_BASE_URL }),
    DatabaseModule.forRoot({ connectionUrl: settings.DATABASE_URL, schema: appSchema }),
    BackendThrottlerModule.forRoot(),
    ObservabilityModule,
    JwtModule,
    NestjsAuthModule.forRootAsync({
      imports: [JwtModule],
      inject: [JwtService],
      useFactory: (jwtSvc: JwtService) => ({
        keyStore: () => jwtSvc.getKeyStore(),
        issuer: settings.JWT_ISSUER,
        audience: settings.JWT_AUDIENCE,
      }),
    }),
    AuthModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
