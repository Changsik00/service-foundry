# spec-14-05: 보안 포트 (general rate-limit + secrets provider)

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-14-05` |
| **Phase** | `phase-14` |
| **Branch** | `spec-14-05-security-ports` |
| **상태** | Planning |
| **타입** | Feature |
| **Integration Test Required** | no |
| **작성일** | 2026-05-31 |
| **소유자** | dennis |

## 📋 배경 및 문제 정의

### 현재 상황
- rate-limit 은 `@repo/backend-auth-rate-limit`(로그인 전용: IP+account sliding window + lockout + CSRF) 만 있고, **임의 작업/엔드포인트용 범용 rate limiter 가 없다**.
- secret 접근은 `process.env` 직접 참조 — **추상화(provider) 부재**로 vault/secret manager 교체·테스트 주입 불가.

### 문제점
- 비-로그인 경로(웹훅, 외부 API 호출, 워커 작업)의 throttling 표준 부재.
- secret 출처가 env 에 하드 결합 → 보안 baseline B+ 정체.

### 해결 방안 (요약)
framework-agnostic core 포트 2개 추가(ADR-0015 cache/storage 패턴): 범용 `RateLimiter` + `SecretsProvider`. in-memory/env 어댑터로 즉시 사용, redis/vault 어댑터는 후속.

## 🎯 요구사항

### Functional Requirements
1. **`@repo/backend-rate-limit`** (신규): `RateLimiter` 포트 `consume(key, cost?) -> Promise<{ allowed; remaining; retryAfterMs }>` + `createMemoryRateLimiter({ limit, windowMs, now? })` (fixed-window per key).
2. **`@repo/backend-secrets`** (신규): `SecretsProvider` 포트 `get(key) -> Promise<string|null>` · `require(key) -> Promise<string>`(없으면 `AppError` INTERNAL) + `createEnvSecrets(env?)` + `createMemorySecrets(map)`.

### Non-Functional Requirements
1. framework-agnostic core (ADR-0015). `now` 주입으로 rate-limit 결정성 테스트.
2. secrets `require` 실패는 ADR-0020 규약(throw AppError) 준수.
3. 새 런타임 dep 0 (표준 라이브러리 + @repo/errors).

## 🚫 Out of Scope (후속)
- redis rate-limit 어댑터 / vault·AWS Secrets Manager 어댑터 — 포트만, 어댑터 후속.
- auth-rate-limit 과의 통합/리팩터 — 별개 유지(로그인 전용 로직).
- NestJS 어댑터(가드/인터셉터 배선) — 후속.

## 📑 ADR 후보
- [ ] 없음 (ADR-0015 적용)

## 🔗 관련 문서 (Related)
- ADR-0015(core/adapter), ADR-0020(에러 규약)
- phase-14 성공 기준 4

## ✅ Definition of Done
- [ ] `@repo/backend-rate-limit` consume(허용/차단/윈도우 리셋/cost) 단위 PASS
- [ ] `@repo/backend-secrets` get/require(env·memory, 없음→AppError) 단위 PASS
- [ ] 전체 단위 PASS + typecheck 0
- [ ] walkthrough / pr_description ship + push + PR + CI green
