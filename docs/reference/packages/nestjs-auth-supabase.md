---
type: reference
aliases: ["@repo/nestjs-auth-supabase", "Supabase 인증 모듈"]
tags: [service-foundry, reference, nestjs, auth, supabase]
---

# @repo/nestjs-auth-supabase — Supabase 인증 모드 어댑터

> 💡 **한 줄 요약**: `AUTH_MODE=supabase` 일 때 Supabase JWT 를 검증하는 `AccessTokenVerifier` 구현 — 신형(ES256/JWKS)·레거시(HS256/시크릿) 양쪽 지원, native 와 동일한 `nestjs-auth` 계약 충족.
> **위치**: `packages/nestjs/auth-supabase` · **상위**: [[architecture]]

## 책임 (Responsibility)

Supabase 발급 JWT 를 검증해 내부 `VerifiedIdentity`(`sub`/`role`/`orgId`)로 정규화한다. 신형 프로젝트는 `supabaseUrl` 의 JWKS 엔드포인트(`/auth/v1/.well-known/jwks.json`)로 공개키를 자동 조회(jose `createRemoteJWKSet`)하고, 레거시 프로젝트는 `jwtSecret` 대칭키로 검증한다. Supabase `role` 클레임(`service_role`→`admin`, 그 외→`user`)을 내부 Role 로 매핑하고, `ACTIVE_ORG_CLAIM`(payload 또는 `app_metadata`)에서 org 를 추출한다. [[reference/packages/nestjs-auth|@repo/nestjs-auth]]의 `ACCESS_TOKEN_VERIFIER` 에 바인딩 ([[adr/0023-auth-authority-modes|ADR-0023]]).

## 공개 API / export

| export | 종류 | 설명 |
|---|---|---|
| `NestjsSupabaseAuthModule` | class (`@Module`) | `forRoot({ supabaseUrl?, jwtSecret? })` DynamicModule |
| `SupabaseAuthOptions` | type | `{ supabaseUrl?, jwtSecret? }` (둘 중 하나 필수) |
| `SupabaseVerifier` | class | `AccessTokenVerifier` 구현 (JWKS 또는 HS256 검증) |
| `SUPABASE_JWT_OPTIONS` | symbol | 옵션 DI 토큰 |
| `SUPABASE_PROVISION_PORT` | symbol | 프로비저닝 포트 DI 토큰 (선택) |
| `SupabaseProvisionPort` | type | provider→내부 org 프로비저닝 포트 |
| `SupabaseJwtOptions` | type | JWT 검증 옵션 |

## 의존

- 내부: [[reference/packages/nestjs-auth|@repo/nestjs-auth]] (`AccessTokenVerifier`/`ACCESS_TOKEN_VERIFIER`), `@repo/backend-auth-jwt` (`ACTIVE_ORG_CLAIM`)
- 외부: `@nestjs/common`, `jose`

## 사용 예

```ts
import { NestjsSupabaseAuthModule } from "@repo/nestjs-auth-supabase";

// 신형 (JWKS 자동 조회)
@Module({ imports: [NestjsSupabaseAuthModule.forRoot({ supabaseUrl: process.env.SUPABASE_URL })] })
export class AppModule {}
```

## 연결된 개념

- [[adr/0023-auth-authority-modes]] — native/firebase/supabase 권위 모드
- [[adr/0026-provider-mode-active-org-transport]] — provider 모드 active org 전송
- [[reference/packages/nestjs-auth-firebase]] — 동일 패턴의 Firebase 어댑터
- [[explainers/auth/jwt-verify-edDSA]] — JWKS 기반 JWT 검증 원리

> 소스: `packages/nestjs/auth-supabase/src/index.ts`, `supabase-verifier.ts`, `supabase-auth.module.ts`
