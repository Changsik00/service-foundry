# Task List: spec-07-02

> 모든 task는 한 commit에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

## Pre-flight (Plan 작성 단계)

- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성 (이 파일)
- [x] 백로그 업데이트 (phase-07.md SPEC 표 갱신)
- [ ] 사용자 Plan Accept

---

## Task 1: 브랜치 생성 + DB 스키마 마이그레이션

### 1-1. 브랜치 생성
- [ ] `git checkout -b spec-07-02-auth-mfa-totp` (시작점: `phase-07-auth-extension`)
- [ ] Commit: 없음

### 1-2. DB 스키마
- [ ] `apps/api/src/infra/schema/mfa-configs.ts` — [NEW] `mfa_configs` 테이블 (userId, secret, backupCodeHashes, enabled)
- [ ] `apps/api/src/infra/schema/index.ts` — `appSchema`에 `mfaConfigs` 추가
- [ ] `apps/api/src/infra/schema/local.ts` — `mfaConfigs` export 추가
- [ ] `cd apps/api && pnpm db:generate` → 마이그레이션 파일 확인
- [ ] Commit: `feat(spec-07-02): db schema — mfa_configs table`

---

## Task 2: `@repo/backend-auth-mfa` 패키지 — TOTP + Backup 유틸 (TDD)

### 2-1. 패키지 초기 구조
- [ ] `packages/backend/auth-mfa/package.json` (name: `@repo/backend-auth-mfa`, deps: `otplib`, `bcryptjs`, `@types/bcryptjs`)
- [ ] `packages/backend/auth-mfa/tsconfig.json`
- [ ] `packages/backend/auth-mfa/vitest.config.ts`

### 2-2. TOTP 유틸 (TDD)
- [ ] `src/totp.test.ts`:
  - `generateSecret()` → base32 문자열 20자 이상
  - `generateTotpUri(secret, email, issuer)` → `otpauth://totp/...` 형식
  - `verifyTotp(secret, validCode)` → true
  - `verifyTotp(secret, "000000")` → false (잘못된 코드)
- [ ] 테스트 실행 → Fail 확인
- [ ] `src/totp.ts`:
  - `generateSecret()`: `authenticator.generateSecret()` (otplib)
  - `generateTotpUri(secret, email, issuer)`: `authenticator.keyuri(email, issuer, secret)`
  - `verifyTotp(secret, token)`: `authenticator.check(token, secret)`
- [ ] 테스트 실행 → Pass 확인

### 2-3. Backup Code 유틸 (TDD)
- [ ] `src/backup.test.ts`:
  - `generateBackupCodes()` → 10개, 각 8자리 hex
  - `hashBackupCodes(codes)` → 배열 길이 동일, bcrypt hash 형식
  - `verifyBackupCode(plain, hashes)` → 매칭 시 index 반환, 없으면 -1
- [ ] 테스트 실행 → Fail 확인
- [ ] `src/backup.ts` 구현
- [ ] 테스트 실행 → Pass 확인
- [ ] `src/index.ts` — 공개 exports
- [ ] Commit: `feat(spec-07-02): auth-mfa package — totp + backup utilities`

---

## Task 3: MfaStore + MfaService + signin MFA 분기

### 3-1. MfaStore (interface + Drizzle 구현)
- [ ] `apps/api/src/auth/mfa.stores.ts`:
  - `MfaStore` interface: `findByUserId / upsert / updateEnabled / updateBackupHashes / deleteByUserId`
  - `createDrizzleMfaStore(db)` 구현
  - `MFA_STORE` symbol + `InjectMfaStore` decorator

### 3-2. MfaService
- [ ] `apps/api/src/auth/mfa.service.ts`:
  - `enroll(userId)` → `{ totpUri, backupCodes }` (enabled=false로 upsert)
  - `confirmEnroll(userId, code)` → 검증 후 enabled=true + backupHashes 저장
  - `verifyMfa(mfaChallengeToken, code)` → challenge token 검증 → TOTP OR backup code 검증 → `{ userId }`
  - `disableMfa(userId, code)` → TOTP 검증 후 레코드 삭제

### 3-3. signin MFA 분기
- [ ] `apps/api/src/auth/signin.service.ts` 수정:
  - `mfaEnabled` 체크 추가
  - MFA 활성화 시: `signMfaChallengeToken(userId)` → `{ status: "mfa_required", mfaChallengeToken }`
  - 기존 세션 발급 로직은 MFA 비활성화 시만 실행
- [ ] `pnpm --filter api typecheck` → 0 errors
- [ ] Commit: `feat(spec-07-02): apps/api mfa service + signin mfa branch`

---

## Task 4: MfaController + e2e 테스트 + Module 등록

### 4-1. MfaController
- [ ] `apps/api/src/auth/mfa.controller.ts`:
  - `POST /auth/mfa/totp/enroll` (AuthGuard) → `{ totpUri, backupCodes }`
  - `POST /auth/mfa/totp/enroll/confirm` (AuthGuard) `{ code }` → `{ status: "ok" }`
  - `POST /auth/mfa/totp/verify` (no auth) `{ mfaChallengeToken, code }` → `{ accessToken }`
  - `POST /auth/mfa/totp/disable` (AuthGuard) `{ code }` → `{ status: "ok" }`

### 4-2. Module 등록
- [ ] `apps/api/src/auth/auth.module.ts` — MfaService, MfaController, MFA_STORE 추가
- [ ] `apps/api/package.json` — `@repo/backend-auth-mfa` 의존성 추가

### 4-3. e2e 테스트
- [ ] `apps/api/src/auth/auth.e2e.test.ts` — MFA 시나리오 추가:
  - `POST /auth/mfa/totp/enroll` (Bearer) → 200 + totpUri + backupCodes
  - `POST /auth/mfa/totp/enroll/confirm` (Bearer + 유효 code) → 200
  - `POST /auth/signin` (MFA 활성 계정) → 200 + `{ status: "mfa_required", mfaChallengeToken }`
  - `POST /auth/mfa/totp/verify` (유효 code) → 200 + accessToken
  - `POST /auth/mfa/totp/verify` (잘못된 code) → 401
  - `POST /auth/mfa/totp/disable` (Bearer + 유효 code) → 200
- [ ] `pnpm --filter api test` → 전체 PASS
- [ ] Commit: `feat(spec-07-02): apps/api mfa controller + e2e tests`

---

## Task 5: Ship

- [ ] 전체 테스트 실행 → 모두 PASS
- [ ] 코드 품질 점검
- [ ] **walkthrough.md 작성**
- [ ] **pr_description.md 작성**
- [ ] **Ship Commit**: `docs(spec-07-02): ship walkthrough and pr description`
- [ ] **Push**: `git push -u origin spec-07-02-auth-mfa-totp`
- [ ] **PR 생성** (base: `phase-07-auth-extension`)
- [ ] **사용자 알림**: PR URL 보고

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 5 (+ Pre-flight) |
| **예상 commit 수** | 4개 (Task 1~4) + Ship |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-05-22 |
