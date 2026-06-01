# @repo/nestjs-auth

> Bearer JWT 검증 `AuthGuard`, RBAC `RolesGuard`, 데코레이터 — NestJS 앱에서 `@repo/backend-auth-jwt`를 DI로 활용.

## 설치 / import
```ts
import { NestjsAuthModule, AuthGuard, RolesGuard, Roles, CurrentUser } from "@repo/nestjs-auth";
```

## 핵심 API
- `NestjsAuthModule.forRoot({ keyStore, issuer, audience })` / `forRootAsync(opts)` — DI 설정 DynamicModule 팩토리
- `AuthGuard` — Authorization 헤더 Bearer 토큰 검증 → `AuthenticatedUser` request 부착
- `RolesGuard` — `@Roles()` 메타데이터 기반 RBAC Guard
- `Roles("admin")` — 핸들러/컨트롤러 역할 데코레이터
- `CurrentUser` — `@CurrentUser()` 파라미터 데코레이터
- `AuthenticatedUser` — `{ sub, role, iat, exp }` 인증된 사용자 타입
- `NESTJS_AUTH_OPTIONS` — DI 설정 token

## 자세히
- 레퍼런스: [`docs/reference/packages/nestjs-auth.md`](../../../docs/reference/packages/nestjs-auth.md)
- 동작 원리: [`docs/explainers/auth/auth-guard-verified-claims.md`](../../../docs/explainers/auth/auth-guard-verified-claims.md)
- NestJS 어댑터 패턴: [`docs/explainers/platform/nestjs-adapter-module-pattern.md`](../../../docs/explainers/platform/nestjs-adapter-module-pattern.md)
