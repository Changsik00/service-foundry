---
type: reference
aliases: ["@repo/backend-auth-rate-limit", "인증 레이트리밋 잠금"]
tags: [service-foundry, reference, auth, rate-limit]
---

# @repo/backend-auth-rate-limit — 로그인 레이트 리밋 + 계정 잠금 + CSRF

> 💡 **한 줄 요약**: IP+계정 기반 슬라이딩 윈도우 실패 횟수 추적, 계정 잠금, CSRF 토큰 발행·검증을 제공하는 framework-agnostic 패키지 (ADR-0014).
> **위치**: `packages/backend/auth-rate-limit` · **상위**: [[architecture]]

## 책임 (Responsibility)

로그인 실패 횟수를 DB에 기록(`recordFailure`)하고 잠금 임계값 초과 시 계정을 잠근다(`evaluateLockout`). 성공 시 카운터를 초기화(`recordSuccess`)하며, 레이트 리밋 결정(`checkRateLimit`)과 잠금 상태 확인(`isLocked`)을 제공한다. CSRF 토큰 발행·검증도 포함한다. 범용 레이트 리밋은 `@repo/backend-rate-limit` 참조.

## 공개 API / export

| export | 종류 | 설명 |
|---|---|---|
| `checkRateLimit` | fn | 레이트 리밋 결정 (허용/거부) |
| `recordFailure` | fn | 로그인 실패 기록 |
| `recordSuccess` | fn | 로그인 성공 후 카운터 리셋 |
| `RATE_LIMIT_DEFAULTS` | const | 기본 레이트 리밋 옵션 |
| `RateLimitContext` | type | 요청 컨텍스트 타입 |
| `RateLimitDecision` | type | 결정 결과 타입 |
| `RateLimitOptions` | type | 레이트 리밋 설정 타입 |
| `evaluateLockout` | fn | 잠금 임계값 평가 |
| `isLocked` | fn | 현재 잠금 상태 확인 |
| `LOCKOUT_DEFAULTS` | const | 기본 잠금 옵션 |
| `LockoutOptions` | type | 잠금 설정 타입 |
| `LockoutStatus` | type | 잠금 상태 타입 |
| `issueCsrfToken` | fn | CSRF 토큰 발행 |
| `verifyCsrfToken` | fn | CSRF 토큰 검증 |
| `drizzleRateLimitStore` | fn | Drizzle 기반 저장소 팩토리 |
| `createFakeRateLimitStore` | fn | 테스트용 인메모리 저장소 팩토리 |
| `FakeRateLimitStore` | type | 페이크 저장소 타입 |
| `RateLimitStore` | type | 저장 포트 인터페이스 |
| `FailedLoginRow` | type | 실패 로그인 DB 행 타입 |
| `FailedLoginInsert` | type | 실패 로그인 삽입 타입 |
| `LockoutRow` | type | 잠금 DB 행 타입 |
| `LockoutInsert` | type | 잠금 삽입 타입 |

## 의존

- 내부: [[backend-database]] (`@repo/backend-database`), [[shared-errors]] (`@repo/errors`)
- 외부: `drizzle-orm` (DB 쿼리)

## 사용 예

```ts
import { checkRateLimit, recordFailure, evaluateLockout } from "@repo/backend-auth-rate-limit";

const decision = await checkRateLimit(store, { ip: "1.2.3.4", account: "user@example.com" });
if (!decision.allowed) throw new Error("Too many attempts");
await recordFailure(store, { ip: "1.2.3.4", account: "user@example.com" });
const status = await evaluateLockout(store, { account: "user@example.com" });
```

## 연결된 개념

- [[explainers/auth/auth-rate-limit-lockout]] — 슬라이딩 윈도우 + 잠금 메커니즘 상세
- [[adr/0014-auth-security-baseline]] — 레이트 리밋·CSRF 보안 기준
- [[adr/0006-auth-strategy]] — 인증 보안 전략
- [[backend-rate-limit]] — 범용 레이트 리밋 포트

> 소스: spec-05-05 · `packages/backend/auth-rate-limit/src/`
