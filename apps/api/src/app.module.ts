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
import { createTenantDb, TENANT_ALS, TenantAls } from "./infra/tenant.js";
import { JwtModule } from "./jwt/jwt.module.js";
import { JwtService } from "./jwt/jwt.service.js";
import { LifecycleModule } from "./lifecycle/lifecycle.module.js";
import { ObservabilityModule } from "./metrics/observability.module.js";
import { NotificationModule } from "./notification/notification.module.js";
import { type AppSettings, loadSettings } from "./settings.js";

const settings: AppSettings = loadSettings(process.env);

// 요청 스코프 테넌트 컨텍스트(ALS). DATABASE.db 를 이 ALS 인지 proxy 로 감싸,
// org 컨텍스트로 열린 트랜잭션이 있으면 모든 쿼리를 거기로 라우팅한다 (spec-17-07).
const tenantAls = new TenantAls();

@Module({
  imports: [
    BackendSettingsModule.forRoot(loadSettings),
    BackendLoggerModule.forRoot({ level: settings.LOG_LEVEL }),
    HttpClientModule.forRoot({ baseUrl: settings.HTTP_CLIENT_BASE_URL }),
    DatabaseModule.forRoot({
      connectionUrl: settings.DATABASE_URL,
      schema: appSchema,
      wrapDb: (db) => createTenantDb(db, tenantAls),
    }),
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
    { provide: TENANT_ALS, useValue: tenantAls },
    { provide: APP_INTERCEPTOR, useClass: TenantContextInterceptor },
  ],
})
export class AppModule {}
