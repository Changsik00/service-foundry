# Plan: spec-07-02-auth-mfa-totp

## 브랜치 전략

```
phase-07-auth-extension  ← base (Phase Base Branch)
  └── spec-07-02-auth-mfa-totp  ← 작업 브랜치
```

## 아키텍처 요약

```
packages/backend/auth-mfa/      ← 신규 패키지 (@repo/backend-auth-mfa)
  src/
    totp.ts          — generateSecret, generateTotpUri, verifyTotp
    backup.ts        — generateBackupCodes, hashBackupCodes, verifyBackupCode
    index.ts         — public exports

apps/api/src/
  infra/schema/
    mfa-configs.ts   — mfa_configs 테이블 (userId, secret, backupCodeHashes, enabled)
    index.ts         — appSchema에 mfaConfigs 추가
  auth/
    mfa.stores.ts    — DrizzleMfaStore (MfaStore interface)
    mfa.service.ts   — enroll / confirmEnroll / verify / disable
    mfa.controller.ts — POST /auth/mfa/totp/* 엔드포인트
    signin.service.ts — MFA 분기 추가 (mfa_required 응답)
    auth.module.ts   — MfaService, MfaController 등록
    auth.e2e.test.ts — MFA e2e 시나리오 추가
```

## 사용자 검토 필요

> [!IMPORTANT]
> - [ ] TOTP 시크릿 **평문 저장** (암호화 없음) — 보안 trade-off 동의 필요
> - [ ] Backup codes: **bcrypt 해시 저장** (평문 복구 불가) — 사용자에게 초기 발급 시 한 번만 노출

## DB 스키마

```sql
CREATE TABLE mfa_configs (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  secret               TEXT NOT NULL,                      -- 평문 (ADR 후보)
  backup_code_hashes   TEXT[] NOT NULL DEFAULT '{}',       -- bcrypt hash
  enabled              BOOLEAN NOT NULL DEFAULT false,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## MFA Challenge Token

```typescript
// payload: { sub: userId, type: "mfa_challenge" }
// exp: 5분
// 기존 JwtService.sign() 재사용, audience: "mfa_challenge"
```

## 흐름

```
[Enroll]
POST /auth/mfa/totp/enroll (Bearer)
  → generateSecret() → generateTotpUri() → generateBackupCodes()
  → upsert mfa_configs(enabled=false)
  → return { totpUri, backupCodes }  ← backup codes는 이때만 평문 노출

POST /auth/mfa/totp/enroll/confirm (Bearer)
  → verifyTotp(secret, code) ✓
  → update mfa_configs(enabled=true, backupCodeHashes=bcrypt(codes))
  → return { status: "ok" }

[Signin MFA Branch]
POST /auth/signin
  → verifyPassword ✓
  → if mfa_configs.enabled → sign mfaChallengeToken(5min)
  → return { status: "mfa_required", mfaChallengeToken }

POST /auth/mfa/totp/verify
  → verifyJwt(mfaChallengeToken, audience:"mfa_challenge") → userId
  → verifyTotp OR verifyBackupCode (일회용 소진)
  → createSession() → accessToken + refresh cookie

[Disable]
POST /auth/mfa/totp/disable (Bearer)
  → verifyTotp ✓ → delete mfa_configs
```

## 주요 결정

| 컴포넌트 | 전략 | 이유 |
|---|---|---|
| TOTP 라이브러리 | `otplib` | RFC 6238 호환, 모노레포 내 기존 미사용 |
| 시크릿 저장 | 평문 | 암호화 키 관리 복잡성 제거 (ADR 후보로 기록) |
| Backup code | bcrypt hash | 일회용 패스워드와 동일 취급 |
| Challenge token | JWT (audience=mfa_challenge) | 기존 JWT 인프라 재사용, 일반 access token과 분리 |

## ADR 후보

- [ ] `mfa-secret-plaintext-storage` (type: tradeoff) — 시크릿 평문 저장 이유 및 암호화 미구현 범위

## 검증 계획

```bash
pnpm --filter @repo/backend-auth-mfa test  # TOTP + Backup 단위 테스트
pnpm --filter api test                      # e2e MFA 플로우 포함 전체
```

## Rollback

- `mfa_configs` 테이블 drop + `signin.service.ts` MFA 분기 제거
- 사용자 세션에 영향 없음 (기존 세션 유지)

## Task 분해

| Task | 작업 | Commit |
|---|---|---|
| 1 | 브랜치 + DB 스키마 마이그레이션 | `feat(spec-07-02): db schema — mfa_configs table` |
| 2 | `@repo/backend-auth-mfa` TOTP + Backup 유틸 (TDD) | `feat(spec-07-02): auth-mfa package — totp + backup utilities` |
| 3 | MfaStore + MfaService + signin MFA 분기 | `feat(spec-07-02): apps/api mfa service + signin mfa branch` |
| 4 | MfaController + e2e 테스트 + Module 등록 | `feat(spec-07-02): apps/api mfa controller + e2e tests` |
| 5 | Ship | `docs(spec-07-02): ship walkthrough and pr description` |

## Deliverables 체크

- [x] spec.md 작성
- [x] plan.md 작성
- [ ] task.md 작성
- [ ] 사용자 Plan Accept
