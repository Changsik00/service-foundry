# Walkthrough: spec-05-07 — Email Verify Flow

## 증거 로그

### 전체 테스트 (30 tests PASS)

```
✓ src/jwt/jwks.controller.test.ts             2 tests
✓ src/auth/password-reset.service.test.ts      3 tests
✓ src/auth/password-reset.confirm.service.test.ts  7 tests
✓ src/auth/email-verify.service.test.ts        3 tests
✓ src/auth/email-verify.confirm.service.test.ts  4 tests
✓ src/auth/auth.e2e.test.ts                   10 tests
✓ src/health/health.e2e.test.ts                1 test

Test Files  7 passed (7)
Tests       30 passed (30)
Duration    1.08s
```

### Typecheck & Biome

```
turbo typecheck: 24 successful (23 cached)
biome check src/: Checked 25 files. No fixes applied.
```

### 커밋 목록

```
4a4524c test(spec-05-07): E2E — email verify round-trip (real PG)
c97e211 feat(spec-05-07): email verify confirm — token check + email_verified update
71b533c feat(spec-05-07): email verify request endpoint — 24h TTL + enumeration-safe
23eef45 feat(spec-05-07): email_verify_tokens schema + migration
```

---

## 설계 결정 기록

### 1. spec-05-06 패턴 답습 (변경 없음)

password-reset-flow에서 확립된 패턴을 그대로 사용:
- SHA-256 token hash (원본 미저장)
- 항상 200 반환 (enumeration-safe)
- console.info email stub
- zodPipe inline 검증
- Store 인터페이스 + Drizzle 구현

### 2. AuthModule 통합 (별도 EmailVerifyModule 미생성)

EmailVerifyService를 기존 AuthModule의 providers에 추가했다. 별도 모듈 생성은 오버엔지니어링 — AuthController, UserStore, DB 등 모든 DI 의존성을 공유하므로 통합이 자연스럽다.

### 3. UserStore.updateEmailVerified() 추가

기존 password-reset.stores.ts의 UserStore 인터페이스에 `updateEmailVerified(id)` 메서드를 추가했다. password reset과 email verify가 같은 users 테이블을 조작하므로 하나의 Store 인터페이스로 통합하는 것이 응집도를 높인다.

### 4. EMAIL_VERIFY_TOKEN_STORE DI token 위치

`email-verify.stores.ts`에 정의. `email-verify.service.ts`에서 re-export하지 않고 직접 `email-verify.stores.ts`에서 import. 순환 참조 방지 + 책임 분리.

### 5. TTL: 24h (password-reset의 15min과 다름)

이메일 인증은 사용자가 외부 메일함을 확인하는 시간이 필요하므로 24h를 선택. password reset은 보안 민감 작업이라 15min으로 짧게 유지.

### 6. biome organizeImports auto-fix

biome `--write` 실행으로 import 순서 정렬이 자동 처리됐다. pre-commit hook이 이를 자동으로 적용했으므로 별도 수작업 불필요.
