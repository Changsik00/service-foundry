---
type: reference
aliases: ["@repo/nestjs-auth-firebase", "Firebase 인증 모듈"]
tags: [service-foundry, reference, nestjs, auth, firebase]
---

# @repo/nestjs-auth-firebase — Firebase 인증 모드 어댑터

> 💡 **한 줄 요약**: `AUTH_MODE=firebase` 일 때 Firebase ID 토큰을 검증하는 `AccessTokenVerifier` 구현 — native(자체 JWT)와 동일한 `nestjs-auth` 계약을 충족.
> **위치**: `packages/nestjs/auth-firebase` · **상위**: [[architecture]]

## 책임 (Responsibility)

firebase-admin 으로 Firebase ID 토큰을 검증하고 내부 `VerifiedIdentity`(`sub`/`role`/`orgId`)로 정규화한다. [[reference/packages/nestjs-auth|@repo/nestjs-auth]]의 `ACCESS_TOKEN_VERIFIER` DI 토큰에 자신을 바인딩해 `AuthGuard` 가 모드에 무관하게 동작하도록 한다 (Consistent Wrapped SDK, [[adr/0023-auth-authority-modes|ADR-0023]]). Firebase UID 는 UUID 가 아니므로, 선택적 `FirebaseProvisionPort` 로 내부 UUID·org 를 프로비저닝하고 custom claims(`ACTIVE_ORG_CLAIM`)를 역기입한다.

## 공개 API / export

| export | 종류 | 설명 |
|---|---|---|
| `NestjsFirebaseAuthModule` | class (`@Module`) | `forRoot({ serviceAccount, projectId? })` DynamicModule — `ACCESS_TOKEN_VERIFIER` 제공 |
| `FirebaseAuthOptions` | type | `{ serviceAccount, projectId? }` |
| `FirebaseVerifier` | class | `AccessTokenVerifier` 구현 (ID 토큰 검증 + provision) |
| `FIREBASE_ADMIN_APP` | symbol | firebase-admin `App` DI 토큰 |
| `FIREBASE_PROVISION_PORT` | symbol | 프로비저닝 포트 DI 토큰 (선택) |
| `FirebaseProvisionPort` | type | `provisionFromProvider(uid, email) => { orgId, orgRole, internalUserId }` |

## 의존

- 내부: [[reference/packages/nestjs-auth|@repo/nestjs-auth]] (`AccessTokenVerifier`/`VerifiedIdentity`/`ACCESS_TOKEN_VERIFIER`), `@repo/backend-auth-jwt` (`ACTIVE_ORG_CLAIM`)
- 외부: `@nestjs/common`, `firebase-admin`

## 사용 예

```ts
import { NestjsFirebaseAuthModule } from "@repo/nestjs-auth-firebase";

@Module({ imports: [NestjsFirebaseAuthModule.forRoot({ serviceAccount })] })
export class AppModule {}
```

## 연결된 개념

- [[adr/0023-auth-authority-modes]] — native/firebase/supabase 권위 모드
- [[adr/0026-provider-mode-active-org-transport]] — provider 모드 active org 전송
- [[reference/packages/nestjs-auth-supabase]] — 동일 패턴의 Supabase 어댑터
- [[explainers/frontend/auth-sdk-provider-adapters]] — Consistent Wrapped SDK

> 소스: `packages/nestjs/auth-firebase/src/index.ts`, `firebase-verifier.ts`, `firebase-auth.module.ts`
