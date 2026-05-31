# @repo/backend-auth-audit

> 인증 관련 이벤트(로그인·실패·MFA 등)를 감사 로그 DB에 비동기로 기록하는 포트+어댑터 패키지.

## 설치 / import
```ts
import { AuthEventBus, AuditService, drizzleAuditLogStore } from "@repo/backend-auth-audit";
```

## 핵심 API
- `AuthEventBus` — 인증 이벤트 발행/구독 버스 (emit / on)
- `AuditService` — 이벤트 버스 구독 후 `AuditLogStore`에 저장하는 오케스트레이터
- `drizzleAuditLogStore(db)` — Drizzle 기반 `AuditLogStore` 팩토리
- `authAuditLogs` — Drizzle 테이블 정의 (스키마 등록 시 사용)

## 자세히
- 레퍼런스: [`docs/reference/packages/backend-auth-audit.md`](../../../docs/reference/packages/backend-auth-audit.md)
- 동작 원리: [`docs/explainers/auth/audit-event-bus.md`](../../../docs/explainers/auth/audit-event-bus.md)
