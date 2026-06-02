# spec-05-06: Password Reset Flow (apps/api)

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-05-06` |
| **Phase** | `phase-05` |
| **Branch** | `spec-05-06-password-reset-flow` |
| **상태** | Planning |
| **타입** | Feature |
| **Integration Test Required** | yes |
| **작성일** | 2026-05-21 |
| **소유자** | dennis |

## 📋 배경 및 문제 정의

### 현재 상황

- spec-05-01 ~ 05-05 완료: `@repo/auth-contracts` / `auth-session` / `auth-jwt` / `auth-password` / `auth-rate-limit` 코어 패키지 전부 배포.
- `apps/api`는 `GET /health` endpoint만 존재. 실 auth endpoint 없음.
- `PasswordResetRequest` / `PasswordResetConfirm` Zod schema는 `@repo/auth-contracts`에 이미 정의됨 (spec-05-01).
- `@repo/backend-auth-jwt`의 `toJwks()` 구현 완료이나 JWKS endpoint 미마운트.
- `DatabaseModule.forRoot({ schema: {} })` — apps/api 자체 Drizzle schema 없음.

### 문제점

- phase-05 성공 기준 #5 (`/auth/password/reset` endpoint 동작) 미충족.
- JWKS endpoint (`/.well-known/jwks.json`) 미마운트 — JWT 소비자가 공개키 검증 불가.
- `users` 테이블 미존재 — 실 사용자 lookup / 비밀번호 갱신 불가.

### 해결 방안

apps/api에 `users` + `password_reset_tokens` Drizzle schema를 추가하고, `AuthModule` (password reset 2 endpoint) + `JwtModule` (JWKS endpoint)을 박는다.

## 📊 개념도

```
POST /auth/password/reset
       ↓
[PasswordResetController] ← ZodPipe(PasswordResetRequest)
       ↓
[PasswordResetService.request(email)]
  ├─ checkRateLimit (per-IP, auth-rate-limit)
  ├─ user = findUserByEmail(email)  ← users 테이블
  ├─ if user: generateToken() → hash → insert password_reset_tokens (15min TTL)
  │            console.log(token)  ← email stub
  └─ always return { status: 'ok' }

POST /auth/password/reset/confirm
       ↓
[PasswordResetController] ← ZodPipe(PasswordResetConfirm)
       ↓
[PasswordResetService.confirm(token, newPassword)]
  ├─ hash token → findByHash → check expires_at + used_at
  ├─ hashPassword(newPassword) via @repo/backend-auth-password
  ├─ updateUserPassword(userId, hash)  ← users 테이블
  ├─ markTokenUsed(tokenId)
  └─ always return { status: 'ok' }

GET /.well-known/jwks.json
       ↓
[JwksController]
  └─ JwtService.getJwks() → toJwks(keyStore)
```

## 🎯 요구사항

### Functional Requirements

1. **`POST /auth/password/reset`** — email 입력 시 항상 HTTP 200 반환 (enumeration 방지). user가 존재하면 crypto 랜덤 token 생성, SHA-256 hash를 DB에 저장, 15분 TTL. plaintext token은 `console.log`로만 노출 (email stub).
2. **`POST /auth/password/reset/confirm`** — `{ token, newPassword }` 입력. token hash 검증 + 만료 확인 + 단일 사용 확인. 통과 시 argon2id로 해시된 새 비밀번호 저장 + token `used_at` 갱신. 검증 실패 시에도 HTTP 200 반환 (enumeration 방지).
3. **`GET /.well-known/jwks.json`** — `@repo/backend-auth-jwt`의 `toJwks(keyStore)`로 공개키 배열 반환.
4. **Rate limit**: request endpoint에서 per-IP 체크 (`@repo/backend-auth-rate-limit`). confirm에는 적용 안 함 (token 1회성으로 충분).
5. **users 테이블**: `id` (uuid PK), `email` (text unique not null), `password_hash` (text not null), `email_verified` (bool default false), `created_at` (timestamptz default now).
6. **password_reset_tokens 테이블**: `id` (uuid PK), `user_id` (uuid not null), `token_hash` (text unique not null), `expires_at` (timestamptz not null), `used_at` (timestamptz nullable), `created_at` (timestamptz default now).
7. **apps/api drizzle config** + `db:generate` / `db:migrate` 스크립트 추가 (apps/api 로컬 schema 전용).

### Non-Functional Requirements

1. enumeration-safe: 존재하지 않는 email이라도 request는 200 반환, token 미발급.
2. token plaintext는 응답 body에 포함하지 않음 — `console.log`로만 개발자 확인. E2E 테스트는 DB 직접 조회로 검증.
3. E2E 테스트: Docker postgres로 실 DB round-trip 검증 (auth-session / auth-rate-limit pattern 답습).
4. depcruise 그린 (`npx depcruise --config packages/config/depcruise-config/base.cjs packages apps`).
5. typecheck PASS (`pnpm typecheck`).

## 🚫 Out of Scope

- 실 이메일 발송 (mailer integration) — stub(console.log)으로 대체. mailer는 별도 spec.
- signin / signup endpoint — phase-06.
- NestJS Guard / Interceptor (JWT verify) — phase-06.
- `nestjs-zod` / Swagger 연동 — 수동 inline ZodPipe 사용 (새 패키지 설치 없음).
- `email_verified` 플래그 갱신 — spec-05-07 (email-verify-flow).
- Redis rate limit — phase-10.
- JWT key 영속화 (private key 환경변수화) — phase-10.
- apps/api와 auth-session / auth-rate-limit 마이그레이션 통합 — 현재 패키지별 분리 유지.

## 📑 ADR 후보

- [x] 없음 (기존 ADR-0013 / ADR-0014 패턴 답습)

## ✅ Definition of Done

- [ ] 단위 테스트 PASS (PasswordResetService — fake DB로 서비스 로직 검증)
- [ ] E2E 테스트 PASS (Docker postgres — password reset round-trip)
- [ ] `walkthrough.md` + `pr_description.md` ship commit
- [ ] `spec-05-06-password-reset-flow` 브랜치 push 완료
- [ ] PR 생성 완료 (target: `phase-05-auth-core-security`)
