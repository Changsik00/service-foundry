# spec-05-02: auth-session — Drizzle Session schema + rotation chain + reuse detection

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-05-02` |
| **Phase** | `phase-05` |
| **Branch** | `spec-05-02-auth-session` |
| **상태** | Planning |
| **타입** | Feature |
| **Integration Test Required** | yes (수동 — 실 PostgreSQL round-trip) |
| **작성일** | 2026-05-20 |
| **소유자** | dennis |

## 📋 배경 및 문제 정의

### 현재 상황

- spec-05-01 머지 — `Session` schema (auth-contracts) + `Token` primitive 박힘
- `@repo/backend-database` (Drizzle) helper 박혀있음 (phase-03)
- *실 schema 정의 없음* — phase-03 의 drizzle migration 실 PG 검증 이연 자연 해소 시점

### 문제점

- session 영속화 부재 — refresh token rotation / reuse detection 불가
- ADR-0013 의 *rotation chain + reuse 시 family 전체 revoke* 동작 안 박힘

### 해결 방안 (요약)

`@repo/backend-auth-session` 신규 패키지 (pure backend). Drizzle Session schema + 함수 3개 (`createSession`, `rotateSession`, `revokeSession`). refresh token *hash 저장* (SHA-256). rotation 시 family id 공유 — reuse 시 family 전체 revoke. token = `crypto.randomBytes(32).toString("base64url")`. drizzle-kit migration 박음. NestJS adapter 는 phase-06 영역.

## 🎯 요구사항

### Functional Requirements

1. **`@repo/backend-auth-session` 패키지** (`packages/backend/auth-session/`) — pure backend
2. **Drizzle Session schema**: id / userId / refreshTokenHash / refreshTokenFamily / createdAt / expiresAt / revokedAt(nullable)
3. **`createSession(db, { userId, ttlMs? })`** — token 생성 + hash 저장 + raw token 반환
4. **`rotateSession(db, presentedToken)`** — 3 result: rotated / reuse_detected (family revoke) / not_found
5. **`revokeSession(db, sessionId)`** — revokedAt 갱신
6. **drizzle-kit migration** — `db:generate` / `db:migrate` script
7. **단위 테스트** 5+ (drizzle mock — spec-03-06 패턴 답습)
8. **수동 검증 README** — 로컬 PG round-trip 가이드

### Non-Functional Requirements

1. depcruise 0 violations (backend → nestjs/react 0)
2. ADR-0013 / 0014 / 0015 답습
3. `@repo/backend-database` 재사용 (자체 pool 박지 말 것)

## 🚫 Out of Scope

- NestJS adapter (`@repo/nestjs-auth-session`) → phase-06
- JWT (access token) → spec-05-03
- CSRF / rate-limit / argon2 → spec-05-04
- password reset / email verify endpoint → spec-05-05/06
- User table → 별 spec
- multi-device tracking (userAgent / ipAddress) → 별 spec
- Redis storage / jti deny list → 별 spec
- testcontainers / Docker integration test → phase-10
- apps/api startup migration check → 별 spec

## 📑 ADR 후보

- [x] **없음** — ADR-0013 / 0014 / 0015 답습.

## ✅ Definition of Done

- [ ] `@repo/backend-auth-session` 신설 (schema + funcs + token primitives)
- [ ] drizzle-kit migration 박음
- [ ] 단위 테스트 PASS
- [ ] lint / typecheck / depcruise 그린
- [ ] 수동 검증 README
- [ ] walkthrough / pr_description ship
- [ ] PR 생성 (base = `phase-05-auth-core-security`)
