# PR: spec-05-06 — Password Reset Flow

## 요약

apps/api에 비밀번호 재설정 플로우를 구현한다. 토큰 기반 이메일 인증 방식으로, 항상 200을 반환해 계정 존재 여부를 노출하지 않는다.

## 변경 사항

### 새 파일

- `apps/api/src/infra/schema/users.ts` — users 테이블 (id, email unique, password_hash, email_verified, created_at)
- `apps/api/src/infra/schema/password-reset-tokens.ts` — password_reset_tokens 테이블 (id, user_id, token_hash unique, expires_at, used_at nullable, created_at)
- `apps/api/src/infra/schema/index.ts` + `local.ts` — schema re-export + drizzle-kit 진입점
- `apps/api/drizzle.config.ts` + `drizzle/0000_white_post.sql` — migration 설정 + SQL
- `apps/api/src/jwt/jwt.service.ts` — Ed25519 in-memory key store (OnModuleInit async init)
- `apps/api/src/jwt/jwks.controller.ts` — GET /.well-known/jwks.json (SkipThrottle)
- `apps/api/src/jwt/jwt.module.ts`
- `apps/api/src/auth/password-reset.service.ts` — request() + confirm() 로직
- `apps/api/src/auth/password-reset.stores.ts` — Store 인터페이스 + Drizzle 구현
- `apps/api/src/auth/auth.controller.ts` — POST /auth/password/reset, POST /auth/password/reset/confirm
- `apps/api/src/auth/auth.module.ts`
- `apps/api/src/auth/password-reset.service.test.ts` — request 단위 테스트 (3)
- `apps/api/src/auth/password-reset.confirm.service.test.ts` — confirm 단위 테스트 (7)
- `apps/api/src/auth/auth.e2e.test.ts` — E2E 테스트 real PG (6)

### 수정 파일

- `apps/api/src/app.module.ts` — JwtModule + AuthModule import 추가
- `apps/api/package.json` — 새 패키지 dep + drizzle 스크립트
- `biome.json` (root) — `apps/api/src/**` override: `unsafeParameterDecoratorsEnabled: true`

## API 명세

| Method | Path | Request | Response |
|--------|------|---------|----------|
| POST | `/auth/password/reset` | `{ email }` | `{ status: "ok" }` 200 (항상) |
| POST | `/auth/password/reset/confirm` | `{ token, newPassword }` | `{ status: "ok" }` 200 (항상) |
| GET | `/.well-known/jwks.json` | — | `{ keys: JWK[] }` |

## 테스트 결과

```
Test Files  5 passed (5)
Tests       19 passed (19)
  - jwt/jwks.controller.test.ts     2
  - auth/password-reset.service.test.ts  3
  - auth/password-reset.confirm.service.test.ts  7
  - auth/auth.e2e.test.ts           6 (real PG)
  - health/health.e2e.test.ts       1
```

## 주요 설계 결정

- **Enumeration-safe**: 모든 auth 엔드포인트 항상 200 반환
- **Token 저장**: SHA-256 hash only (원본 미저장, ADR-0014 패턴)
- **Email stub**: console.info로 token 출력 (실 이메일 out-of-scope)
- **JWKS**: Ed25519 in-memory key store, 비공개키 'd' 미노출

## 체크리스트

- [x] 단위 테스트 작성 (TDD)
- [x] E2E 테스트 (real PG)
- [x] biome lint PASS
- [x] typecheck PASS
- [x] 기존 테스트 회귀 없음 (health E2E 포함)
