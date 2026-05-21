/**
 * @repo/nestjs-auth — NestJS 인증/인가 어댑터.
 *
 * - `AuthGuard`: Bearer JWT 검증 → `AuthenticatedUser` 부착 (ADR-0006 Core Surface).
 * - `RolesGuard`: `@Roles(...)` 메타데이터 기반 RBAC.
 * - `@Roles` / `@CurrentUser`: 데코레이터.
 * - `NestjsAuthModule.forRoot` / `forRootAsync`: DynamicModule.
 *
 * ADR-0015 (framework-adapter 네이밍) + ADR-0016 (표준 @Module class) 준수.
 */
export {
  type AuthenticatedUser,
  AuthGuard,
  NESTJS_AUTH_OPTIONS,
  type NestjsAuthOptions,
} from "./auth.guard.js";
export { CurrentUser, Roles } from "./decorators.js";
export { type NestjsAuthAsyncOptions, NestjsAuthModule } from "./module.js";
export { ROLES_KEY, RolesGuard } from "./roles.guard.js";
