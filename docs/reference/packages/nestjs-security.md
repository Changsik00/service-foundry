---
type: reference
aliases: ["@repo/nestjs-security", "NestJS 보안 모듈"]
tags: [service-foundry, reference, nestjs, secrets]
---

# @repo/nestjs-security — NestJS HTTP 보안 미들웨어 어댑터

> 💡 **한 줄 요약**: `applySecurity()` + `BackendThrottlerModule` 로 helmet/CORS/요청 속도 제한을 한 번에 설정.
> **위치**: `packages/nestjs/security` · **상위**: [[architecture]]

## 책임 (Responsibility)

helmet(HTTP 헤더 보안), CORS, `@nestjs/throttler` 기반 글로벌 요청 속도 제한을 하나의 어댑터 패키지로 묶는다. `applySecurity(app, opts)` 함수는 `main.ts`에서 앱 생성 직후 호출하고, `BackendThrottlerModule.forRoot(opts)`는 `AppModule`에 import해 `APP_GUARD` 자동 등록한다.

## 공개 API / export

| export | 종류 | 설명 |
|---|---|---|
| `applySecurity(app, opts?)` | fn | helmet + enableCors 적용 헬퍼 |
| `SecurityOptions` | interface | `{ helmet?, cors? }` 옵션 타입 |
| `BackendThrottlerModule` | class (`@Module`) | `forRoot(opts?)` — 글로벌 Throttler Guard 등록 |
| `BackendThrottlerOptions` | interface | `{ ttl?, limit? }` (기본: 60s/100req) |

## 의존

- 내부: (없음)
- 외부: `@nestjs/common`, `@nestjs/core`, `@nestjs/throttler`, `helmet`, `reflect-metadata`

## 사용 예

```ts
// main.ts
import { applySecurity } from "@repo/nestjs-security";
const app = await NestFactory.create(AppModule);
applySecurity(app, { cors: { origin: "https://app.example.com" } });

// AppModule
import { BackendThrottlerModule } from "@repo/nestjs-security";
@Module({ imports: [BackendThrottlerModule.forRoot({ ttl: 60_000, limit: 60 })] })
export class AppModule {}
```

## 연결된 개념

- [[adr/0015-framework-adapter-naming-and-layout]] — 어댑터 네이밍 규약
- [[adr/0016-nestjs-adapter-standard-module-pattern]] — 표준 Module 패턴
- [[nestjs-auth]] — 인증 Guard와 조합 사용

> 소스: spec-03-07 · `packages/nestjs/security/src/index.ts`
