/**
 * @repo/nestjs-security — NestJS adapter for HTTP security middleware.
 *
 * - `applySecurity(app, opts)` helper: helmet + cors wire-up (call in main.ts after `NestFactory.create`).
 * - `BackendThrottlerModule.forRoot(opts)`: `@nestjs/throttler` wrap with `APP_GUARD` auto-registered (global rate-limit preset).
 *
 * 본 module 은 ADR-0015 (framework-adapter naming/layout) + ADR-0016 (NestJS standard `@Module` class) 따름.
 * `auth-specific` rate-limit (login attempt limit 등) 은 phase-05+ `auth-security` 패키지 영역.
 */
import type { INestApplication } from "@nestjs/common";
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
