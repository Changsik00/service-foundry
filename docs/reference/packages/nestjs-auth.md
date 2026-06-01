---
type: reference
aliases: ["@repo/nestjs-auth", "NestJS 인증 모듈"]
tags: [service-foundry, reference, nestjs, auth, jwt]
---

# @repo/nestjs-auth — NestJS 인증/인가 어댑터

> 💡 **한 줄 요약**: Bearer JWT 검증 `AuthGuard`, RBAC `RolesGuard`, 데코레이터 — NestJS 앱에서 `@repo/backend-auth-jwt` 를 DI로 활용.
> **위치**: `packages/nestjs/auth` · **상위**: [[architecture]]

## 책임 (Responsibility)

`@repo/backend-auth-jwt`의 JWT 검증 로직을 NestJS Guard·Decorator 패턴으로 노출한다. `AuthGuard`는 Authorization 헤더에서 Bearer 토큰을 추출하고 `JwtPayload`를 검증한 뒤 `AuthenticatedUser`를 request에 부착한다. `RolesGuard`는 `@Roles()` 메타데이터를 읽어 역할 기반 접근 제어를 수행한다. `NestjsAuthModule.forRoot`/`forRootAsync`로 옵션을 DI 설정한다.

## 공개 API / export

| export | 종류 | 설명 |
|---|---|---|
| `AuthGuard` | class (Guard) | Bearer JWT 검증 → `AuthenticatedUser` request 부착 |
| `AuthenticatedUser` | type | `{ sub, role }` (검증된 claim에서만 추출) |
| `NESTJS_AUTH_OPTIONS` | symbol | DI token |
| `NestjsAuthOptions` | type | `{ keyStore, issuer, audience }` 옵션 인터페이스 |
| `RolesGuard` | class (Guard) | `@Roles()` 메타데이터 기반 RBAC Guard |
| `ROLES_KEY` | const | Reflect 메타데이터 키 |
| `Roles` | decorator | `@Roles("admin")` 핸들러 데코레이터 |
| `CurrentUser` | decorator | `@CurrentUser()` 파라미터 데코레이터 |
| `NestjsAuthModule` | class (`@Module`) | `forRoot(opts)` / `forRootAsync(opts)` DynamicModule |
| `NestjsAuthAsyncOptions` | type | 비동기 설정 옵션 |

## 의존

- 내부: [[shared-auth-contracts]] (`@repo/auth-contracts`, `Role` 등), `@repo/backend-auth-jwt`
- 외부: `@nestjs/common`, `@nestjs/core`, `jose`, `reflect-metadata`

## 사용 예

```ts
import { NestjsAuthModule, AuthGuard, RolesGuard, Roles, CurrentUser } from "@repo/nestjs-auth";

@Module({ imports: [NestjsAuthModule.forRoot({ keyStore, issuer: "myapp", audience: "myapp" })] })
export class AppModule {}

@UseGuards(AuthGuard, RolesGuard)
@Roles("admin")
@Get("/admin")
adminOnly(@CurrentUser() user: AuthenticatedUser) {
  return { userId: user.sub };
}
```

## 연결된 개념

- [[adr/0015-framework-adapter-naming-and-layout]] — 어댑터 네이밍 규약
- [[adr/0016-nestjs-adapter-standard-module-pattern]] — 표준 Module 패턴
- [[adr/0006-auth-strategy]] — 인증 전략 결정
- [[explainers/auth/auth-guard-verified-claims]] — Guard 동작 원리
- [[shared-auth-contracts]] — `JwtPayload`, `AuthSDK` 계약

> 소스: spec-06-01, spec-14-03 · `packages/nestjs/auth/src/index.ts`
