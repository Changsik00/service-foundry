---
type: reference
aliases: ["@repo/backend-auth-session", "세션 관리 로테이션"]
tags: [service-foundry, reference, auth, session]
---

# @repo/backend-auth-session — 리프레시 토큰 세션 생성·로테이션·폐기

> 💡 **한 줄 요약**: 리프레시 토큰 해시 저장, family 기반 재사용 탐지, 세션 로테이션 체인을 구현하는 framework-agnostic 세션 관리 패키지 (ADR-0013).
> **위치**: `packages/backend/auth-session` · **상위**: [[architecture]]

## 책임 (Responsibility)

세션 생성(`createSession`), 로테이션(`rotateSession`), 폐기(`revokeSession`) 세 가지 핵심 연산을 제공한다. 리프레시 토큰은 `base64url` 랜덤값으로 생성하고 SHA-256 해시로만 DB에 저장한다. `refreshTokenFamily` 기반 재사용 탐지로 토큰 탈취 시도를 감지한다. NestJS 어댑터는 phase-06 별도 패키지다.

## 공개 API / export

| export | 종류 | 설명 |
|---|---|---|
| `createSession` | fn | 신규 세션 + 리프레시 토큰 발급 |
| `rotateSession` | fn | 기존 세션 만료 후 신규 세션 발급 (로테이션) |
| `revokeSession` | fn | 세션 폐기 |
| `generateRefreshToken` | fn | 랜덤 리프레시 토큰 생성 |
| `hashToken` | fn | 토큰 SHA-256 해싱 |
| `drizzleSessionStore` | fn | Drizzle 기반 세션 저장소 팩토리 |
| `SessionStore` | type | 세션 저장 포트 인터페이스 |
| `sessions` | const | Drizzle 테이블 정의 |
| `schema` | const | 스키마 객체 |
| `SessionRow` | type | DB 세션 행 타입 |
| `SessionInsert` | type | 세션 삽입 타입 |
| `CreateSessionInput` | type | 세션 생성 입력 타입 |
| `CreateSessionResult` | type | 세션 생성 결과 타입 |
| `RotateResult` | type | 로테이션 결과 타입 |

## 의존

- 내부: [[backend-database]] (`@repo/backend-database`), [[shared-errors]] (`@repo/errors`)
- 외부: `drizzle-orm` (DB 쿼리)

## 사용 예

```ts
import { createSession, rotateSession, revokeSession } from "@repo/backend-auth-session";

const { session, refreshToken } = await createSession(store, { userId: "u1", userAgent: "..." });
// 리프레시 요청 시:
const { session: newSession, refreshToken: newToken } = await rotateSession(store, refreshToken);
// 로그아웃 시:
await revokeSession(store, session.id);
```

## 연결된 개념

- [[explainers/auth/session-rotation-chain]] — 로테이션 체인 + reuse detection 동작 원리
- [[adr/0013-session-lifecycle]] — 세션 수명 주기 결정
- [[adr/0014-auth-security-baseline]] — 해시 저장·family 격리 보안 기준
- [[adr/0006-auth-strategy]] — 인증 전략 내 세션 정책

> 소스: spec-05-02 · `packages/backend/auth-session/src/`
