---
type: reference
aliases: ["@repo/backend-auth-audit", "인증 감사 로그"]
tags: [service-foundry, reference, auth, audit]
---

# @repo/backend-auth-audit — 인증 이벤트 감사 로그 수집 및 저장

> 💡 **한 줄 요약**: 인증 관련 이벤트(로그인·실패·MFA 등)를 감사 로그 DB에 비동기로 기록하는 포트+어댑터 패키지.
> **위치**: `packages/backend/auth-audit` · **상위**: [[architecture]]

## 책임 (Responsibility)

`AuthEventBus`를 통해 인증 도메인 이벤트를 수신하고 `AuditLogStore` 포트로 영속화한다. Drizzle 기반 실 구현(`drizzleAuditLogStore`)과 스키마(`authAuditLogs`)를 함께 제공하며, `AuditService`가 이벤트 버스와 저장소를 조율한다. 감사 로그는 비가역적(append-only) 기록이다.

## 공개 API / export

| export | 종류 | 설명 |
|---|---|---|
| `AuditService` | class | 이벤트 버스 구독 → 감사 로그 저장 오케스트레이터 |
| `AuditLogStore` | type | 감사 로그 저장 포트 인터페이스 |
| `AuditLogRow` | type | DB 행 타입 |
| `authAuditLogs` | const | Drizzle 테이블 정의 |
| `schema` | const | 스키마 객체 |
| `drizzleAuditLogStore` | fn | Drizzle 기반 `AuditLogStore` 팩토리 |
| `AuthEventBus` | class | 인증 이벤트 발행/구독 버스 |
| `AuthEvent` | type | 인증 이벤트 유니언 타입 |

## 의존

- 내부: [[backend-database]] (Drizzle + PostgreSQL 풀 팩토리)
- 외부: 없음 (`drizzle-orm`은 devDependency로만 사용)

## 사용 예

```ts
import { AuthEventBus, AuditService, drizzleAuditLogStore } from "@repo/backend-auth-audit";
import { createDatabase } from "@repo/backend-database";

const { db } = createDatabase({ connectionUrl: process.env.DATABASE_URL!, schema: {} });
const store = drizzleAuditLogStore(db);
const bus = new AuthEventBus();
const svc = new AuditService(bus, store);

bus.emit({ type: "login.success", userId: "u1", ip: "1.2.3.4" });
```

## 연결된 개념

- [[explainers/auth/audit-event-bus]] — 이벤트 버스 발행/구독 동작 원리
- [[adr/0013-session-lifecycle]] — 세션 이벤트 감사 요건
- [[adr/0014-auth-security-baseline]] — 감사 로그 보안 기준
- [[adr/0006-auth-strategy]] — 인증 전략 결정

> 소스: spec-06-04 · `packages/backend/auth-audit/src/`
