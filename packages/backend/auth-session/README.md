# @repo/backend-auth-session

> 리프레시 토큰 해시 저장, family 기반 재사용 탐지, 세션 로테이션 체인을 구현하는 framework-agnostic 세션 관리 패키지 (ADR-0013).

## 설치 / import
```ts
import { createSession, rotateSession, revokeSession, drizzleSessionStore } from "@repo/backend-auth-session";
```

## 핵심 API
- `createSession(store, input)` — 신규 세션 + 리프레시 토큰 발급
- `rotateSession(store, refreshToken)` — 기존 세션 만료 후 신규 세션 발급 (로테이션)
- `revokeSession(store, sessionId)` — 세션 폐기
- `drizzleSessionStore(db)` — Drizzle 기반 세션 저장소 팩토리

## 자세히
- 레퍼런스: [`docs/reference/packages/backend-auth-session.md`](../../../docs/reference/packages/backend-auth-session.md)
- 동작 원리: [`docs/explainers/auth/session-rotation-chain.md`](../../../docs/explainers/auth/session-rotation-chain.md)
