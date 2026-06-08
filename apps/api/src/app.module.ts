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
import { SuperuserGuard } from "./infra/superuser-guard.provider.js";
import { TenantContextInterceptor } from "./infra/tenant.interceptor.js";
import { createTenantDb } from "./infra/tenant.js";
import { TenantModule, tenantAls } from "./infra/tenant.module.js";
import { JwtModule } from "./jwt/jwt.module.js";
import { JwtService } from "./jwt/jwt.service.js";
import { LifecycleModule } from "./lifecycle/lifecycle.module.js";
import { ObservabilityModule } from "./metrics/observability.module.js";
import { NotificationModule } from "./notification/notification.module.js";
import { type AppSettings, loadSettings } from "./settings.js";

const settings: AppSettings = loadSettings(process.env);

@Module({
  imports: [
    TenantModule,
    BackendSettingsModule.forRoot(loadSettings),
    BackendLoggerModule.forRoot({ level: settings.LOG_LEVEL }),
    HttpClientModule.forRoot({ baseUrl: settings.HTTP_CLIENT_BASE_URL }),
    DatabaseModule.forRoot({
      connectionUrl: settings.DATABASE_URL,
      schema: appSchema,
      // 테스트: 병렬 e2e 파일이 각자 풀을 띄우므로 풀을 작게 잡아 Postgres 커넥션 고갈을 막는다
      // (요청 스코프 tx 가 커넥션을 점유하므로 더 민감 — spec-17-07). 운영은 기본값 사용.
      ...(settings.NODE_ENV === "test" ? { poolSize: 3 } : {}),
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
  providers: [{ provide: APP_INTERCEPTOR, useClass: TenantContextInterceptor }, SuperuserGuard],
})
export class AppModule {}
