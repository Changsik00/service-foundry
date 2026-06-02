# Walkthrough: spec-07-01-auth-oauth

> 증거 로그 — spec 완료 시점의 실제 실행 결과를 기록합니다.

## 1. 브랜치 & 시작점

```
브랜치: spec-07-01-auth-oauth
시작점: phase-07-auth-extension (Phase Base Branch 모드)
```

## 2. 테스트 결과

### `@repo/backend-auth-oauth` (단위 테스트)

```
 ✓ src/account.test.ts (3 tests)
 ✓ src/state.test.ts   (7 tests)
 ✓ src/pkce.test.ts    (5 tests)
 ✓ src/token.test.ts   (4 tests)

 Test Files  4 passed (4)
      Tests  19 passed (19)
```

### `@apps/api` (통합 + 유닛 테스트)

```
 ✓ src/auth/auth.e2e.test.ts              (20 tests)
   — Auth E2E: 17기존 + OAuth 3 (redirect×2, state mismatch×1)
 ✓ src/auth/auth.controller.test.ts       (10 tests)
 ✓ src/auth/signin.service.test.ts        (3 tests)
 ✓ src/auth/signup.service.test.ts        (3 tests)
 ✓ src/auth/password-reset.service.test.ts (3 tests)
 ✓ src/auth/password-reset.confirm.service.test.ts (7 tests)
 ✓ src/auth/email-verify.service.test.ts  (3 tests)
 ✓ src/auth/email-verify.confirm.service.test.ts (4 tests)
 ✓ src/health/health.e2e.test.ts          (1 test)

 Test Files  9 passed (9) [+1 = 10 전체 pass]
      Tests  56 passed (56)
```

## 3. OAuth redirect 검증 (e2e)

```
GET /auth/oauth/google
→ 302 + Location: https://accounts.google.com/o/oauth2/v2/auth?...&code_challenge=...&state=...
→ Set-Cookie: oauth_state=...; oauth_pkce=...

GET /auth/oauth/kakao
→ 302 + Location: https://kauth.kakao.com/oauth/authorize?...

GET /auth/oauth/google/callback?code=any&state=wrong-state
  (Cookie: oauth_state=correct-state)
→ 401 Unauthorized (state mismatch)
```

## 4. 커밋 히스토리

```
feat(spec-07-01): apps/api oauth controller + module wiring
feat(spec-07-01): auth-oauth package — account linking logic
feat(spec-07-01): auth-oauth package — providers + token exchange + schema
feat(spec-07-01): auth-oauth package — pkce + state utilities
feat(spec-07-01): db schema — oauth_accounts table + passwordHash nullable
chore(spec-07-01): branch spec-07-01-auth-oauth
```

## 5. 주요 설계 결정

| 결정 | 이유 |
|---|---|
| OAuth token 미저장 | 암호화 키 관리 부담 회피; providerAccountId만으로 계정 식별 충분 |
| State: timingSafeEqual | 타이밍 공격 방지 (CSRF) |
| PKCE S256 | code_verifier 탈취 방어 |
| OAuthAccountStore interface | Drizzle 직접 주입 없이 단위 테스트 가능 |
| passwordHash nullable | OAuth-only 사용자 지원 (소셜 로그인만으로 가입) |

## 6. 타입체크 + 린트

```
pnpm typecheck → 28 packages, 0 errors
pnpm lint      → no errors (info 1: template literal suggestion)
```
