# Walkthrough: spec-07-02-auth-mfa-totp

## 1. 브랜치 & 시작점

```
브랜치: spec-07-02-auth-mfa-totp
시작점: phase-07-auth-extension (Phase Base Branch 모드)
```

## 2. 테스트 결과

### `@repo/backend-auth-mfa` (단위 테스트)

```
 ✓ src/totp.test.ts  (6 tests)
 ✓ src/backup.test.ts (8 tests)  ← bcrypt 해싱으로 인해 ~2.9초

 Test Files  2 passed (2)
      Tests  14 passed (14)
```

### `@apps/api` (통합 + 유닛 + e2e)

```
 ✓ src/auth/auth.e2e.test.ts (29 tests)
   — 기존 20 + MFA 수직 슬라이스 9 신규
 ✓ 나머지 유닛 테스트 (36 tests)

 Test Files  10 passed (10)
      Tests  65 passed (65)
```

## 3. MFA 수직 슬라이스 결과

```
POST /auth/signup                                    → 201
POST /auth/mfa/totp/enroll (Bearer)                  → 200 + totpUri
POST /auth/mfa/totp/enroll/confirm (잘못된 코드)      → 401
POST /auth/mfa/totp/enroll/confirm (유효 코드)        → 200 + backupCodes[10]
POST /auth/signin (MFA 활성)                          → 200 + mfa_required + mfaChallengeToken
POST /auth/mfa/totp/verify (잘못된 코드)              → 401
POST /auth/mfa/totp/verify (유효 코드)                → 200 + accessToken + refresh cookie
POST /auth/mfa/totp/disable (유효 코드)               → 200
POST /auth/signin (MFA 비활성 후)                     → 200 + accessToken (일반 세션)
```

## 4. 커밋 히스토리

```
feat(spec-07-02): apps/api mfa controller + e2e tests
feat(spec-07-02): apps/api mfa service + signin mfa branch
feat(spec-07-02): auth-mfa package — totp + backup utilities
feat(spec-07-02): db schema — mfa_configs table
```

## 5. 주요 설계 결정

| 결정 | 이유 |
|---|---|
| `enroll` → totpUri만 반환 | backup codes는 confirm 완료 후에만 노출 (UX 정확성) |
| `confirmEnroll` → backupCodes 반환 | MFA 활성화 확인 후 최초 1회만 노출 |
| `MfaService.verifyMfa`에서 UserStore로 role 조회 | `AuthGuard`가 role claim 필수 요구 |
| `AuthController`에 `@Optional() MfaService` | MfaService 없이도 기존 signin 테스트 동작 유지 |
| TOTP 시크릿 평문 저장 | 암호화 키 관리 복잡성 제거 (ADR 후보: mfa-secret-plaintext-storage) |

## 6. 타입체크 + 린트

```
pnpm typecheck → 35 packages, 0 errors
pnpm lint      → warnings 2 (info only: noNonNullAssertion in tests)
```
