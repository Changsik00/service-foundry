# @repo/nestjs-security

> `applySecurity()` + `BackendThrottlerModule`로 helmet/CORS/요청 속도 제한을 한 번에 설정.

## 설치 / import
```ts
import { applySecurity, BackendThrottlerModule } from "@repo/nestjs-security";
```

## 핵심 API
- `applySecurity(app, opts?)` — helmet + enableCors 일괄 적용 헬퍼 (`main.ts`에서 호출)
- `SecurityOptions` — `{ helmet?, cors? }` 옵션 타입
- `BackendThrottlerModule.forRoot(opts?)` — 글로벌 Throttler Guard 등록 DynamicModule
- `BackendThrottlerOptions` — `{ ttl?, limit? }` (기본: 60s/100req)

## 자세히
- 레퍼런스: [`docs/reference/packages/nestjs-security.md`](../../../docs/reference/packages/nestjs-security.md)
- 동작 원리: [`docs/explainers/platform/nestjs-adapter-module-pattern.md`](../../../docs/explainers/platform/nestjs-adapter-module-pattern.md)
