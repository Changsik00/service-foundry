import { AsyncLocalStorage } from "node:async_hooks";
import { Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { NestjsAuthModule } from "@repo/nestjs-auth";
import { DatabaseModule } from "@repo/nestjs-database";
import { HttpClientModule } from "@repo/nestjs-http-client";
import { BackendLoggerModule } from "@repo/nestjs-logger";
import { BackendThrottlerModule } from "@repo/nestjs-security";
import { BackendSettingsModule } from "@repo/nestjs-settings";

import { AuthModule } from "./auth/auth.module.js";
import { HealthController } from "./health/health.controller.js";
import { appSchema } from "./infra/schema/index.js";
import { TenantContextInterceptor } from "./infra/tenant.interceptor.js";
import { TENANT_ALS } from "./infra/tenant.js";
import { JwtModule } from "./jwt/jwt.module.js";
import { JwtService } from "./jwt/jwt.service.js";
import { LifecycleModule } from "./lifecycle/lifecycle.module.js";
import { ObservabilityModule } from "./metrics/observability.module.js";
import { NotificationModule } from "./notification/notification.module.js";
import { type AppSettings, loadSettings } from "./settings.js";

const settings: AppSettings = loadSettings(process.env);

@Module({
  imports: [
    BackendSettingsModule.forRoot(loadSettings),
    BackendLoggerModule.forRoot({ level: settings.LOG_LEVEL }),
    HttpClientModule.forRoot({ baseUrl: settings.HTTP_CLIENT_BASE_URL }),
    DatabaseModule.forRoot({ connectionUrl: settings.DATABASE_URL, schema: appSchema }),
    BackendThrottlerModule.forRoot(),
    LifecycleModule,
    ObservabilityModule,
    NotificationModule,
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
  providers: [
    { provide: TENANT_ALS, useValue: new AsyncLocalStorage() },
    { provide: APP_INTERCEPTOR, useClass: TenantContextInterceptor },
  ],
})
export class AppModule {}
