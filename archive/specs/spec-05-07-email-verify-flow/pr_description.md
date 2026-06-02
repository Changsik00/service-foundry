# PR: spec-05-07 — Email Verify Flow

## 요약

apps/api에 이메일 인증 플로우를 구현한다. spec-05-06 (password-reset-flow)과 동일한 패턴으로, 항상 200을 반환해 계정 존재 여부를 노출하지 않는다.

## 변경 사항

### 새 파일

- `apps/api/src/infra/schema/email-verify-tokens.ts` — email_verify_tokens 테이블
- `apps/api/drizzle/0001_nostalgic_wasp.sql` — migration
- `apps/api/src/auth/email-verify.stores.ts` — EmailVerifyTokenStore 인터페이스 + Drizzle 구현
- `apps/api/src/auth/email-verify.service.ts` — request() + confirm() 로직
- `apps/api/src/auth/email-verify.service.test.ts` — request 단위 테스트 (3)
- `apps/api/src/auth/email-verify.confirm.service.test.ts` — confirm 단위 테스트 (4)

### 수정 파일

- `apps/api/src/infra/schema/index.ts` + `local.ts` — emailVerifyTokens 추가
- `apps/api/src/auth/password-reset.stores.ts` — UserStore에 updateEmailVerified() 추가
- `apps/api/src/auth/auth.controller.ts` — 2 route 추가
- `apps/api/src/auth/auth.module.ts` — EmailVerifyService + EMAIL_VERIFY_TOKEN_STORE provider 추가
- `apps/api/src/auth/auth.e2e.test.ts` — email verify E2E 4케이스 추가

## API 명세

| Method | Path | Request | Response |
|--------|------|---------|----------|
| POST | `/auth/email/verify/request` | `{ email }` | `{ status: "ok" }` 200 (항상) |
| POST | `/auth/email/verify/confirm` | `{ token }` | `{ status: "ok" }` 200 (항상) |

## 테스트 결과

```
Test Files  7 passed (7)
Tests       30 passed (30)
  - jwks.controller.test.ts                 2
  - password-reset.service.test.ts          3
  - password-reset.confirm.service.test.ts  7
  - email-verify.service.test.ts            3
  - email-verify.confirm.service.test.ts    4
  - auth.e2e.test.ts                       10 (real PG)
  - health.e2e.test.ts                      1
```

## 주요 설계 결정

- **Enumeration-safe**: 미존재 email, 이미 인증된 user, 미존재/만료/재사용 token 모두 항상 200
- **Token 저장**: SHA-256 hash only (spec-05-06 패턴 동일)
- **TTL**: 24h (password-reset의 15min보다 길게 — 메일함 확인 시간 필요)
- **AuthModule 통합**: 별도 EmailVerifyModule 미생성 — DI 의존성 공유로 응집도 유지

## 체크리스트

- [x] TDD (단위 테스트 선행)
- [x] E2E 테스트 (Docker postgres 5434)
- [x] biome lint PASS
- [x] typecheck PASS
- [x] 기존 테스트 회귀 없음 (password-reset + JWKS 포함)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
