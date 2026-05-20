# phase-05: Auth Core + Security

> Auth Foundation의 *기초 + 보안 baseline*. 2차안 §Phase 1+2 통합. backend 중심.
> `@repo/auth-contracts` 확장 + auth-session + auth-jwt + auth-security + password reset / email verify flow.

## 📋 메타

| 항목 | 값 |
|---|---|
| **Phase ID** | `phase-05` |
| **상태** | Planning (진입 시점) |
| **시작일** | 2026-05-20 |
| **목표 종료일** | 미정 |
| **소유자** | dennis |
| **Base Branch** | `phase-05-auth-core-security` |
| **Base Branch 모드** | Phase Base Branch 모드 — Spec PR이 phase branch로 머지, 모든 Spec 완료 후 phase branch가 main으로 |

## 🎯 배경 및 목표

### 현재 상황

- phase-02에서 `@repo/auth-contracts` *최소 4 schema* (`Role` / `User` / `Session` / `JwtPayload`) 박힘.
- phase-03 (Backend Foundation) 완료 시 NestJS + Drizzle + apps/api 부트 가능.
- **ADR-0006 / 0012 / 0013 / 0014** 확정 (spec-x-auth-foundation-prep):
  - ADR-0006: Auth Platform 전략 (Consistent Wrapped SDK)
  - ADR-0012: AuthErrorCode를 `@repo/errors` 흡수
  - ADR-0013: Session lifecycle (JWT EdDSA + Refresh rotation + Reuse detection)
  - ADR-0014: Security baseline (CSRF / Rate limit / PKCE / argon2 / Step-up)
- 본 phase는 *backend-only* — auth-react / auth-nestjs Guards는 phase-06.

### 목표 (Goal)

`@repo/auth-contracts` 풍부한 schema + `@repo/auth-session` (rotation/revocation) + `@repo/auth-jwt` (jose 기반 EdDSA) + `@repo/auth-security` (CSRF/rate-limit/argon2) + apps/api에 password reset / email verify endpoint 박힘.

### 성공 기준 (Success Criteria) — 정량 우선

1. `@repo/auth-contracts` 확장 — SignInSchema / SignUpSchema / RefreshSchema / PasswordResetSchema / EmailVerifySchema + MfaChallenge interface 자리 잡기.
2. `@repo/auth-session` 작성 — Session model + rotation chain + reuse detection 동작.
3. `@repo/auth-jwt` 작성 — jose EdDSA + JWKS endpoint (`/.well-known/jwks.json`).
4. `@repo/auth-security` 작성 — CSRF middleware + rate limiter + argon2 password hash.
5. apps/api에 `/auth/password/reset` + `/auth/email/verify` endpoint 동작 (실 데이터 round-trip).
6. depcruise 그린.

## 🧩 작업 단위 (SPECs)

<!-- sdd:specs:start -->
| ID | 슬러그 | 우선순위 | 상태 | 디렉토리 |
|---|---|:---:|---|---|
| `spec-05-01` | auth-contracts-extend | P? | Merged | `specs/spec-05-01-auth-contracts-extend/` |
| `spec-05-02` | auth-session | P? | Merged | `specs/spec-05-02-auth-session/` |
<!-- sdd:specs:end -->

### spec-05-01 — auth-contracts-extend

- **요점**: `@repo/auth-contracts` 확장 — SignIn/SignUp/Refresh/PasswordReset/EmailVerify schema + AuthResult union type.
- **참조**: ADR-0006 (AuthResult union), design note §Validation 전략.
- **연관 모듈**: `packages/shared/auth-contracts`
- **추가 검토**: `ts-pattern` 도입 (#19) — AuthResult discriminated union 매칭 + exhaustiveness check

### spec-05-02 — auth-session

- **요점**: Session model (Drizzle schema) + rotation chain (`refreshTokenFamily`) + reuse detection.
- **참조**: ADR-0013.
- **연관 모듈**: `packages/backend/auth-session`
- **추가 가치**: phase-03 의 *이연 항목 (drizzle migration 실 PostgreSQL 검증)* 자연 해소 — 첫 실 schema 정의 시점

### spec-05-03 — auth-jwt

- **요점**: jose EdDSA + Key rotation (90일) + JWKS endpoint + Claims (sub/iat/exp/iss/aud/jti).
- **참조**: ADR-0013.
- **연관 모듈**: `packages/backend/auth-jwt`

### spec-05-04 — auth-security

- **요점**: CSRF middleware + rate limiter (IP/account/progressive) + account lockout + argon2 password hash.
- **참조**: ADR-0014.
- **연관 모듈**: `packages/backend/auth-security`

### spec-05-05 — password-reset-flow

- **요점**: `/auth/password/reset` + `/auth/password/reset/confirm` endpoint. cryptographically random token + single-use + 15분 TTL + 응답 항상 200 (enumeration 방지).
- **참조**: design note §핵심 플로우.
- **연관 모듈**: apps/api + auth-session + auth-security
- **추가 검토**: `nestjs-zod` 도입 (#19/#21) — endpoint DTO 자동 변환 + Swagger 호환 (phase-03 의 *backend lib 후보* 도입 자연)

### spec-05-06 — email-verify-flow

- **요점**: `/auth/email/verify/request` + `/auth/email/verify/confirm` endpoint. single-use token + 24h TTL.
- **참조**: design note §핵심 플로우.
- **연관 모듈**: apps/api + auth-session
- **추가 검토**: spec-05-05 에서 도입한 `nestjs-zod` 패턴 답습. `forRootAsync` 패턴 검토 (apps/api settings load — phase-03 spec-03-08 이월)

## 📌 결정 기록 (Review)

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| `auth-errors` 별 패키지 vs `@repo/errors` 흡수 | 별 패키지 / 흡수 | **흡수** | ADR-0012 — flat code 일관 |
| `auth-session` 별 패키지 vs `auth-jwt` 흡수 | 별 패키지 / 흡수 | **별 패키지** | ADR-0013 — rotation/revocation 응집 |
| MFA 구현 시점 | 본 phase / phase-07 | **phase-07** | 본 phase는 *interface 자리만* (AuthResult union mfa_required) — 구현은 phase-07 |
| `Result` 라이브러리 | neverthrow / `@repo/utils` Result | `@repo/utils` Result | ADR-0008 — 자체 Result 사용. neverthrow 비채택 |
| Session storage | Drizzle (PostgreSQL) / Redis | Drizzle | ADR-0013 — Redis는 access token revocation(jti deny list)에만 *후속* 옵션 |

## 🧪 통합 테스트 시나리오 (간결)

### 시나리오 1: signup → signin → refresh → reuse detection

- **Given**: 전 spec 머지됨 + apps/api 부트.
- **When**: signup → signin → refresh (rotation) → 이미 invalidate된 refresh token으로 재요청 (reuse simulation).
- **Then**: 정상 refresh 후 새 access/refresh 발급 + reuse 시도 시 모든 session revoke + alert log.
- **연관 SPEC**: spec-05-02, spec-05-03

### 시나리오 2: password reset 보안

- **Given**: spec-05-05 머지됨.
- **When**: 존재하지 않는 email로 /auth/password/reset 호출.
- **Then**: 응답 200 (enumeration 방지) + token 발급 안 함.
- **연관 SPEC**: spec-05-05

### 시나리오 3: rate limit

- **Given**: spec-05-04 머지됨.
- **When**: 동일 IP에서 N회 signin 실패.
- **Then**: progressive backoff + N+1회째 lockout 응답 (응답 형식은 동일 — enumeration 방지).
- **연관 SPEC**: spec-05-04

## 🔗 의존성

- **선행 phase**: phase-02 (auth-contracts) + phase-03 (Backend Foundation) + phase-04 (Frontend Foundation — backend-only 영역이라 직접 영향 없으나 통합 자연).
- **외부 시스템**: PostgreSQL.
- **연관 ADR**: 0005 / 0006 / 0008 / 0009 / 0010 / 0012 / 0013 / 0014
- **연관 design note**: `docs/notes/auth-foundation-architecture.md`
- **연관 GitHub issue**: #19 (library candidates — `ts-pattern` Phase 5 / `nestjs-zod` Phase 3 둘 다 본 phase 영역), #21 (NestJS auth/validation 라이브러리 선택)

## 🆕 phase-05 진입 시점 추가 검토 항목 (2026-05-20)

phase-03/04 진행 중 발견 + 사용자 협의로 본 phase 안 흡수:

| 항목 | 흡수 위치 | 출처 |
|---|---|---|
| `ts-pattern` (AuthResult union 매칭) | spec-05-01 | #19 Phase 5 후보 |
| `nestjs-zod` (endpoint DTO + Swagger) | spec-05-05/06 | #19/#21 Phase 3 후보 — 실 endpoint 진입 시점 자연 |
| drizzle migration 실 PG 검증 | spec-05-02 (Session schema = 첫 실 schema) | phase-03 spec-03-08 이연 |
| `forRootAsync` 패턴 (apps/api settings) | spec-05-06 또는 별 spec 검토 | phase-03 spec-03-08 이월 |

## 🏁 Phase Done 조건

- [ ] 모든 SPEC(spec-05-01 ~ spec-05-06) main에 merge
- [ ] 성공 기준 6개 충족
- [ ] 통합 테스트 3개 시나리오 PASS
- [ ] 사용자 최종 승인
