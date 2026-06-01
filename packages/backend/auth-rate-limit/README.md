# @repo/backend-auth-rate-limit

> IP+계정 기반 슬라이딩 윈도우 실패 횟수 추적, 계정 잠금, CSRF 토큰 발행·검증을 제공하는 framework-agnostic 인증 보안 패키지 (ADR-0014).

## 설치 / import
```ts
import { checkRateLimit, recordFailure, recordSuccess, evaluateLockout, issueCsrfToken, verifyCsrfToken } from "@repo/backend-auth-rate-limit";
```

## 핵심 API
- `checkRateLimit(store, ctx)` — 허용/거부 레이트 리밋 결정
- `recordFailure(store, ctx)` / `recordSuccess(store, ctx)` — 실패 기록 및 성공 시 카운터 리셋
- `evaluateLockout(store, ctx)` — 임계값 초과 시 계정 잠금 평가
- `issueCsrfToken()` / `verifyCsrfToken(token, expected)` — CSRF 토큰 발행·검증

## 자세히
- 레퍼런스: [`docs/reference/packages/backend-auth-rate-limit.md`](../../../docs/reference/packages/backend-auth-rate-limit.md)
- 동작 원리: [`docs/explainers/auth/auth-rate-limit-lockout.md`](../../../docs/explainers/auth/auth-rate-limit-lockout.md)
