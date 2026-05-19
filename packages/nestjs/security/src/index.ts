/**
 * @repo/nestjs-security — NestJS adapter for HTTP security middleware.
 *
 * - `applySecurity(app, opts)` helper: helmet + cors wire-up (call in main.ts after `NestFactory.create`).
 * - `BackendThrottlerModule.forRoot(opts)`: `@nestjs/throttler` wrap with `APP_GUARD` auto-registered (global rate-limit preset).
 *
 * 본 module 은 ADR-0015 (framework-adapter naming/layout) + ADR-0016 (NestJS standard `@Module` class) 따름.
 * `auth-specific` rate-limit (login attempt limit 등) 은 phase-05+ `auth-security` 패키지 영역.
 */
import { type DynamicModule, type INestApplication, Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import helmet from "helmet";

export interface SecurityOptions {
  helmet?: Parameters<typeof helmet>[0] | false;
  cors?: Parameters<INestApplication["enableCors"]>[0] | false;
}

export function applySecurity(app: INestApplication, opts: SecurityOptions = {}): void {
  if (opts.helmet !== false) {
    app.use(helmet(opts.helmet));
  }
  if (opts.cors !== false) {
    app.enableCors(opts.cors);
  }
}

export interface BackendThrottlerOptions {
  /** ms 단위 시간 윈도. default 60_000 (60s) */
  ttl?: number;
  /** 윈도당 최대 요청 수. default 100 */
  limit?: number;
}

@Module({})
export class BackendThrottlerModule {
  static forRoot(opts: BackendThrottlerOptions = {}): DynamicModule {
    const ttl = opts.ttl ?? 60_000;
    const limit = opts.limit ?? 100;
    return {
      module: BackendThrottlerModule,
      imports: [ThrottlerModule.forRoot([{ ttl, limit }])],
      providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
      exports: [ThrottlerModule],
      global: true,
    };
  }
}
